// parameters: what is "string"?
// better optiosn for names: url/link
// to make this more flexible: add an optional parameter for 'options'
// wym by this? (down)
// you can make moduleInfo more flexible by varying the year, eg:
// await fetchData("https://api.nusmods.com/v2/{dateRange}/moduleInfo.json" -> then take dateRange from user input
let date = "2022-2023";
async function fetchData(link, options = {}) {
    return fetch(link, options).then(x => x.json());
}
submitForm();
async function submitForm() {
    let moduleInfo = await fetchData(`https://api.nusmods.com/v2/${date}/moduleInfo.json`);
    moduleInfo = removeModulesWithoutExamsAndinSem3or4(moduleInfo);
    const map = mapModuleCodeToHashmap(moduleInfo);
    addStartEndAttributes(moduleInfo);
    sortExamDatesASC(moduleInfo);
    let partitions = findAllPartitionsOfDifferentLengths(moduleInfo);
    let maxLength = maxPartition(partitions);
    console.log(moduleInfo);
    console.log(partitions);
    console.log(maxLength);
}
/*
1) Remove modules without exams (using filter)
1.25) split modules
1.5) add attributes to every module: currStart, currEnd
2) sort exams based on the json attributes, exam date/time asc order
3) use merge intervals algorithm to find the partitions of modules of different lengths
4) find largest partition and the corresponding length
4.5) assign every module a group attribute in JSON
5) adjust all partitions to be the selected length
    - if there is spacing in front of the partition, move the partition in front/ extend forwards, stop when < 8am
    - if there is spacing at the back, move back/extend backwards, stop when exams > 9pm
6) shuffle the timeslots (all equal length) using fisher-yates shuffling algorithm (refer to notes)
7) change the exam dates/times of the modules to new timeslot
7.5) add newStart, newEnd to all modules
8) make the metric calculator
9) make simple tests, eg of format:
    function testFetchData() {
        const input = // input here
        const expected = // expected data
        const result = fetchData(input);
        console.log(expected == result);
    }
10) frontend and stuff
*/

//extra logic
function addMinutes(numOfMinutes, date) {
    let newDate = date;
    newDate.setMinutes(newDate.getMinutes() + numOfMinutes);
    return newDate.toISOString();
}
function mapModuleCodeToHashmap(examsJSON) {
    let map = new Map();
    examsJSON.forEach(x => {
        map.set(x.moduleCode, x);
    })
    return map;
}
function isClash(date1, date2) {
    return date1 >= date2;
}
function getCurrStartDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].currStart);
}
function getCurrEndDate(moduleObject) {
    return new Date(moduleObject.semesterData[0].currEnd);
}
//end of extra logic
function removeModulesWithoutExamsAndinSem3or4(examsJSON) {
    let modsWithExams = examsJSON.filter(x => x.hasOwnProperty("semesterData") && x.semesterData[0] != null && x.semesterData[0].examDate != null);
    let modsInSem1And2 = modsWithExams.filter(x => x.semesterData[0].semester == 1 || x.semesterData[0].semester == 2);
    return modsInSem1And2;
}
//main steps
function addStartEndAttributes(examsJSON) {
    examsJSON.forEach(x => {
        const exam = x.semesterData[0];
        exam.currStart = exam.examDate;
        exam.currEnd = addMinutes(exam.examDuration, new Date(exam.currStart));
    })
}
function sortExamDatesASC(examsJSON) {
    examsJSON.sort((x, y) => {
        let firstDate = new Date(x.semesterData[0].currStart);
        let secondDate = new Date(y.semesterData[0].currStart);
        return firstDate - secondDate;
    })
}
function findAllPartitionsOfDifferentLengths(examsJSON) {
    let arrOfPartitions = [[]];
    for (let i = 0; i < examsJSON.length; i++) {
        if (i == 0) {
            arrOfPartitions[0].push(examsJSON[i]);
        } else if (isClash(getCurrEndDate(examsJSON[i - 1]), getCurrStartDate(examsJSON[i]))) {
            arrOfPartitions.push([]);
            arrOfPartitions[arrOfPartitions.length - 1].push(examsJSON[i]);
        } else {
            arrOfPartitions[arrOfPartitions.length - 1].push(examsJSON[i]);
        }
    }
    return arrOfPartitions;
}
function maxPartition(partitions) {
    let maxLength = -Infinity;
    partitions.forEach(x => {
        if (x.length > maxLength) {
            maxLength = x.length;
        }
    })
    return maxLength;
}