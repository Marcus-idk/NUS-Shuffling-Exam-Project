let date = "2022-2023";
let testData = [["CS1101S", "CS2030S", "CS2040S"], ["CS2040S", "CS3230"]]
async function fetchData(link, options = {}) {
    return fetch(link, options).then(x => x.json())
}
submitForm()
async function submitForm() {
    let moduleInfo = await fetchData(`https://api.nusmods.com/v2/${date}/moduleInfo.json`)
    moduleInfo = removeInvalidModules(moduleInfo)
    addCurrStartEndAttributes(moduleInfo)
    addNewStartAndEndAttributes(moduleInfo)
    const map = mapModuleCodeToHashmap(moduleInfo)
    sortExamDatesASC(moduleInfo)
    let grouped = groupByDay(moduleInfo)
    let metricOld = metricForAllStudents(testData, map)
    shuffle(grouped)
    updateResultsMetric(metricOld, testData, grouped, map)
}
/*
1) Remove modules without exams (using filter)
1.25) split modules
1.5) add attributes to every module: currStart, currEnd
2) sort exams based on the json attributes, exam date/time asc order
3) group the exams up by their day
4) add newStart, newEnd to all modules
5) shuffle the timeslots (all mods on day 1 -> day 2) (refer to notes)
6) change the exam dates/times of the modules to new timeslot
7) make the metric calculator
8) make simple tests, eg of format:
    function testFetchData() {
        const input = // input here
        const expected = // expected data
        const result = fetchData(input)
        console.log(expected == result)
    }
10) frontend and stuff
*/

//extra logic
function addMinutes(numOfMinutes, date) {
    let newDate = date
    newDate.setMinutes(newDate.getMinutes() + numOfMinutes)
    return newDate.toISOString()
}
function mapModuleCodeToHashmap(examsJSON) {
    let map = new Map()
    examsJSON.forEach(x => {
        map.set(x.moduleCode, x)
    })
    return map
}
function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString()
}
function getCurrStartDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].currStart)
}
function getCurrEndDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].currEnd)
}
function getNewStartDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].newStart)
}
function getNewEndDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].newEnd)
}
function changeCurrStartDateDay(moduleObject, day) {
    moduleObject.semesterData[0].currStart.setDate(day)
}
function changeCurrEndDateDay(moduleObject, day) {
    moduleObject.semesterData[0].currEnd.setDate(day)
}
function changeNewStartDateDay(moduleObject, day) {
    const newDate = new Date(moduleObject.semesterData[0].newStart)
    newDate.setDate(day)
    moduleObject.semesterData[0].newStart = newDate.toISOString()
}
function changeNewEndDateDay(moduleObject, day) {
    const newDate = new Date(moduleObject.semesterData[0].newEnd)
    newDate.setDate(day)
    moduleObject.semesterData[0].newEnd = newDate.toISOString()
}
//end of extra logic
function removeInvalidModules(examsJSON) {
    let modsWithExams = examsJSON.filter(x => x.hasOwnProperty("semesterData") && x.semesterData[0] != null && x.semesterData[0].examDate != null)
    let modsInSem1And2 = modsWithExams.filter(x => x.semesterData[0].semester == 1 || x.semesterData[0].semester == 2)
    return modsInSem1And2
}
//main steps
function addCurrStartEndAttributes(examsJSON) {
    examsJSON.forEach(x => {
        const exam = x.semesterData[0]
        exam.currStart = exam.examDate
        exam.currEnd = addMinutes(exam.examDuration, new Date(exam.currStart))
    })
}
function sortExamDatesASC(examsJSON) {
    examsJSON.sort((x, y) => {
        let firstDate = new Date(x.semesterData[0].currStart)
        let secondDate = new Date(y.semesterData[0].currStart)
        return firstDate - secondDate
    })
}
function groupByDay(examsJSON) {
    let arrOfPartitons = [[]]
    for (let i = 0; i < examsJSON.length; i++) {
        if (i == 0) {
            arrOfPartitons[0].push(examsJSON[i])
        } else if (isSameDay(getCurrStartDate(examsJSON[i - 1]), getCurrStartDate(examsJSON[i]))) {
            arrOfPartitons[arrOfPartitons.length - 1].push(examsJSON[i])
        } else {
            arrOfPartitons.push([])
            arrOfPartitons[arrOfPartitons.length - 1].push(examsJSON[i])
        }
    }
    return arrOfPartitons
}
function addNewStartAndEndAttributes(examsJSON) {
    examsJSON.forEach(x => {
        const exam = x.semesterData[0]
        exam.newStart = exam.currStart
        exam.newEnd = exam.currEnd
    })
}
function shuffle(partitions) {
    function swapPartitions(partition1, partition2) {
        let partition1Day = getCurrEndDate(partition1[0]).getDay()
        let partition2Day = getCurrEndDate(partition2[0]).getDay()
        for (let i = 0; i < partition1.length; i++) {
            changeNewStartDateDay(partition1[i], partition2Day)
            changeNewEndDateDay(partition1[i], partition2Day)
        }
        for (let i = 0; i < partition2.length; i++) {
            changeNewStartDateDay(partition2[i], partition1Day)
            changeNewEndDateDay(partition2[i], partition1Day)
        }
    }
    for (let i = partitions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        swapPartitions(partitions[i], partitions[j])
    }
    return partitions;
}
function metricForOneStudent(studentTimeTable, map) {
    let res = 0;
    console.log(studentTimeTable)
    for (let i = 0; i < studentTimeTable.length - 1; i++) {
        res += Math.abs(getNewStartDate(map.get(studentTimeTable[i + 1])).getDay() - getNewEndDate(map.get(studentTimeTable[i])).getDay())
    }
    return res / (studentTimeTable.length - 1)
}
function metricForAllStudents(studentsTimeTable, map) {
    let res = 0;
    for (let i = 0; i < studentsTimeTable.length; i++) {
        res += metricForOneStudent(studentsTimeTable[i], map)
    }
    return res / studentsTimeTable.length
}
function updateResultsMetric(oldMetricValue, testData, partitions, map) {
    const prevMetric = document.querySelector('#resultsMetric strong.red')
    const newMetric = document.querySelector('#resultsMetric strong.green')
    let newMetricValue = metricForAllStudents(testData, map)
    while (newMetricValue <= oldMetricValue) {
      shuffle(partitions)
      newMetricValue = metricForAllStudents(testData, map)
    }
    prevMetric.innerHTML = oldMetricValue.toFixed(2)
    newMetric.innerHTML = newMetricValue.toFixed(2)
}