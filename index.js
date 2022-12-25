async function fetchData(string) {
    return fetch(string).then(x => x.json());
}
let moduleInfo = [];
let arrayOfMaps = [];
let studentsModules = [];
let metricBefore = 0;
let metricAfter = 0;
//O(n^2 + k), where k is the async function, btw its like the far end of n^2 lmao
document.getElementById("shuffle").addEventListener("click", async () => {
    let examTimeTableFile = document.getElementById("inputModuleExamTimes").value;
    let studentsModulesFile = document.getElementById("studentsModules").value;
    try {
        moduleInfo = await fetchData(examTimeTableFile);
        studentsModules = await fetchData(studentsModulesFile);
        let moduleInfoExams = removeAllModulesWithoutExams(moduleInfo);
        const mapByTimeFullTime = putModulesIntoMap(moduleInfoExams);
        const groupUpMap = groupModulesByDay(mapByTimeFullTime);
        let k = findSuitableInterval(groupUpMap, mapByTimeFullTime);
        groupAllModulesByK(groupUpMap, mapByTimeFullTime, k);
        const mapByTimeBeforeShuffling = putModulesIntoMap(arrayOfMaps);
        metricBefore = metricForManyStudents(studentsModules, mapByTimeBeforeShuffling);
        shuffle(arrayOfMaps);
        const mapByTimeAfterShuffling = putModulesIntoMap(arrayOfMaps);
        metricAfter = metricForManyStudents(studentsModules, mapByTimeAfterShuffling);
        document.querySelector("#beforeShuffle").innerHTML = "$$\text{Metric Value }\textbf{Before} \text{ Shuffling:" + metricBefore + "} $$";
        document.querySelector("#afterShuffle").innerHTML = "$$\text{Metric Value }\textbf{Before} \text{ Shuffling:" + metricAfter + "} $$";
    } catch (e) {
        console.log(e);
    }
})

function generateRandomIntegerInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getMinsFromISO(ISOdate) {
    let n = new Date(ISOdate);
    let mins = n.getMinutes();
    let hours = n.getHours();
    let totalMins = mins + hours * 60;
    return totalMins;
}
function checkifLieInside(start, end, timeStart, timeEnd) {
    return timeStart >= start && timeEnd <= end;
}
function removeAllModulesWithoutExams(arr) {
    let result = [];
    let counter = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].semesterData[1] != undefined && arr[i].semesterData[1].hasOwnProperty('examDate')) {
            result[counter] = arr[i];
            counter++;
        }
    }
    return result;
}
function putModulesIntoMap(arr) {
    let map = new Map();
    for (let i = 0; i < arr.length; i++) {
        let date1 = new Date(arr[i].semesterData[1].examDate);
        let date2 = new Date(arr[i].semesterData[1].examDate);
        let minutes = date1.getMinutes();
        let hours = date1.getHours();
        let examEndingTime = minutes + (hours * 60) + arr[i].semesterData[1].examDuration;
        let examEndingTimeMins = examEndingTime % 60;
        let examEndingTimeHours = Math.floor(examEndingTime / 60);
        date2.setMinutes(examEndingTimeMins);
        date2.setHours(examEndingTimeHours);
        map.set(arr[i].moduleCode, [date1.toISOString(), date2.toISOString()]);
    }
    return map;
}
function groupModulesByDay(map) {
    let resultMap = new Map();
    for (let i = 0; i < map.size; i++) {
        let moduleCode = Array.from(map.keys())[i];
        let keyValue = map.get(moduleCode)[0];
        let fullDate = new Date(keyValue);
        let dateNumber = fullDate.getDate().toString();
        let monthNumber = fullDate.getMonth().toString();
        let date = dateNumber + "/" + monthNumber;
        if (resultMap.has(date)) {
            const newData = resultMap.get(date);
            newData[newData.length] = moduleCode;
            resultMap.set(date, newData);
        } else {
            resultMap.set(date, [moduleCode]);
        }
    }
    return resultMap;
}
function findSuitableInterval(mapWithDay, mapWithTiming) { //split into sections of 30 mins, assume shortest exam is 1h long => k = 2
    function indexNtoPturns1(arr, n, p) {
        for (let i = n; i <= p; i++) {
            arr[i] = 1;
        }
    }
    function moreThanNelementsConsec(n, arr) {
        let consec = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == 1) {
                consec += 1;
                if (consec > n) {
                    return true;
                }
            } else {
                consec = 0;
            }
        }
        return false;
    }
    let k = 1;
    let possible = false;
    while (!possible) {
        for (let p = 0; p < mapWithDay.size; p++) {
            let indicator = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
            let date = Array.from(mapWithDay.keys())[p];
            let moduleArray = mapWithDay.get(date);
            for (let i = 0; i < moduleArray.length; i++) {
                const startOfExamISO = new Date(mapWithTiming.get(moduleArray[i])[0]);
                const endOfExamISO = new Date(mapWithTiming.get(moduleArray[i])[1]);
                let startOfExamHours = startOfExamISO.getHours();
                let startOfExamMins = startOfExamISO.getMinutes();
                let startOfExamTime = startOfExamHours * 60 + startOfExamMins;
                let endOfExamHours = endOfExamISO.getHours();
                let endOfExamMins = endOfExamISO.getMinutes();
                let endOfExamTime = endOfExamHours * 60 + endOfExamMins;
                
                let start = Math.floor(startOfExamTime / 30);
                let end = Math.ceil(endOfExamTime / 30);
                indexNtoPturns1(indicator, start, end);
            }
            if (moreThanNelementsConsec(k, indicator)) {
                k += 1;
                break;
            }
            if (p == mapWithDay.size - 1 && !(moreThanNelementsConsec(k, indicator))) {
                possible = true;
            }
        }
    }
    return k;
}
function findSmallestTime(arr, mapByTime) {
    let smallestTime = getMinsFromISO(mapByTime.get(arr[0])[0]);
    for (let i = 0; i < arr.length - 1; i++) {
        if (getMinsFromISO(mapByTime.get(arr[i+1])[0]) < smallestTime) {
            smallestTime = getMinsFromISO(mapByTime.get(arr[i+1])[0]);
        }
    }
    return smallestTime;
}

// START REMOVAL HERE 

function mapkTimeToModules(day, arr, mapByTime, k) {
    while (arr.length != 0) {
        let modulesBelongToThisTime = [];
        let startingTime = findSmallestTime(arr, mapByTime);
        let endingTime = startingTime + k * 30;
        for (let i = 0; i < arr.length; i++) {
            let modTimeStart = getMinsFromISO(mapByTime.get(arr[i])[0]);
            let modTimeEnd = getMinsFromISO(mapByTime.get(arr[i])[1]);
            if (checkifLieInside(startingTime, endingTime, modTimeStart, modTimeEnd)) {
                modulesBelongToThisTime[modulesBelongToThisTime.length] = arr[i];
                arr.splice(i, 1);
            }
        }
        arrayOfMaps[arrayOfMaps.length] = [day, startingTime, endingTime, modulesBelongToThisTime];
    }
}


function groupAllModulesByK(mapOfAllDates, mapByTime, k) {
    for (let i = 0; i < mapOfAllDates.size; i++) {
        let arrOfMods = mapOfAllDates.get(Array.from(mapOfAllDates.keys())[i]);
        let day = Array.from(mapOfAllDates.keys())[i];
        mapkTimeToModules(day, arrOfMods, mapByTime, k);
    }
}
function shuffle(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        for (let y = 0; y < arr.length - 1; y++) {
            if (i == y) continue;
            else {
                if (generateRandomIntegerInRange(1, 10) >= 5) {
                    swapFirstTwoElementsOfArrays(arr[i], arr[y]);
                } else {
                    continue;
                }
            }
        }
    }
}
function swapFirstTwoElementsOfArrays(arr1, arr2) {
    let temp1 = arr2[0];
    let temp2 = arr2[1];
    let temp3 = arr2[2];
    arr2[0] = arr1[0];
    arr2[1] = arr1[1];
    arr2[2] = arr1[2];
    arr1[0] = temp1;
    arr1[1] = temp2;
    arr1[2] = temp3;
}
function putModulesIntoMapAfterShuffling(arrayOfMaps) {
    let outerCounter = 0;
    let map = new Map();
    while (outerCounter < arrayOfMaps.length) {
        let date = arrayOfMaps[outerCounter][0];
        for (let i = 0; i < arrayOfMaps[outerCounter][3].length; i++) {
            map.set(arrayOfMaps[outerCounter][3][i], date);
        } 
        outerCounter++;
    }
    return map;
}
function getDifferenceBetweenTwoDates(date1, date2) {
    let str1 = date1.split("/");
    let str2 = date2.split("/");
    if (str1[1] == str2[1]) {
        return Math.abs(str2[0] - str1[0]);
    } else {
        let res = 0;
        if (str1[1] < str2[1]) {
            for (let i = 0; i < Math.abs(str2[1] - str1[1]); i++) {
                res += (31 - parseInt(str1[0]));
            }
            return res + parseInt(str2[0]);
        } else {
            for (let i = 0; i < Math.abs(str2[1] - str1[1]); i++) {
                res += (31 - parseInt(str2[0]));
            }
            return res + parseInt(str1[0]);
        }
    }
}

// END REMOVAL HERE
function metricForOneStudent(studentExams, mapByDate) {
    let result = 0;
    for (let i = 0; i < studentExams.length - 1; i++) {
        let endOfPrev = mapByDate.get(studentExams[i]);
        let startOfNew = mapByDate.get(studentExams[i + 1]);
        let diff = getDifferenceBetweenTwoDates(endOfPrev, startOfNew);
        result += diff;
    }
    return result / studentExams.length;
}
function metricForManyStudents(arrayOfStudentExamArrays, mapByDate) {
    let totalResult = 0;
    for (let i = 0; i < arrayOfStudentExamArrays.length; i++) {
        let res = metricForOneStudent(arrayOfStudentExamArrays[0], mapByDate);
        totalResult += res;
    }
    return totalResult / arrayOfStudentExamArrays.length;
}