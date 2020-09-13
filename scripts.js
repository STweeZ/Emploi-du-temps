"use strict";

let edt = [];
let matieres = [];
let profs = [];
let groupes = [];
let salles = [];
let commentaires = [];
let deplacements = [];
let comptes = [];

fetch("./js2.json").then(function(resp) { // import the json file that contains the datas
    return resp.json();
}).then(function(data) {
    edt = data.edt;
    matieres = data.matieres;
    profs = data.profs;
    groupes = data.groupes;
    salles = data.salles;
    commentaires = data.commentaires;
    deplacements = data.deplacements;
    comptes = data.comptes;
})

let today = new Date(); // the actual date
let currentMonth = today.getMonth(); // the actual month
let currentYear = today.getFullYear(); // the actual year

let selectMonth = document.getElementById("month"); // the month selected via the menu
let selectYear = document.getElementById("year"); // the year selected via the menu
let selectedWeek = []; // array of the days of the week selected
let selectedSecondWeek = null; // the days of the second week selected
let scheduleToChange = null; // actual schedule selected in case of Modification
let scheduleToInsert = null; // actual schedule selected in case of Insertion
let modifType = null; // the type of modification we'll set (Insertion or Modification)

let typeOfSelection = null; // the type of selection (a day, a month, a week, two weeks)
let inWhichEdtTarget = null; // if we choose to see a specific part of the edt (a teacher, a classroom, a school subject)

let dragElement = null; // the course we drag
let dropElement = null; // the target course

let history = []; // the history of modifications

let connected = false; // if the user is actually connected
let userConnected = null; // the name of the user connected

let months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]; // list of the months in french
let monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; // list of the months in english
let days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]; // list of the days in french
let hours = ["8 H", "9 H", "10 H", "11 H", "12 H", "13 H", "14 H", "15 H", "16 H", "17 H"]; // list of the schedules

let monthAndYear = document.getElementById("monthAndYear"); // the title above the calendar

document.addEventListener('keypress', function(e){ // the action when the user is doing a ctrl+z
    var zKey = 26;
    if(e.ctrlKey && (e.which === zKey)){
        ctrlAndZ();
    }
});

Date.prototype.getWeek = function() { // retrieve the week number via a Date
    var onejan = new Date(this.getFullYear(),0,1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

showCalendar(currentMonth, currentYear); // initialize the calendar

function next() { // next month via the calendar if possible
    let tempYear = (currentMonth === 11) ? currentYear + 1 : currentYear; // the year
    let tempMonth = (currentMonth + 1) % 12; // the month
    if (tempYear <= 2020) { // we can't go above 2018
        currentYear = tempYear;
        currentMonth = tempMonth;
        showCalendar(currentMonth, currentYear); // actualize the calendar
    }
}

function previous() { // previous month via the calendar if possible
    let tempYear = (currentMonth === 0) ? currentYear - 1 : currentYear; // the year
    let tempMonth = (currentMonth === 0) ? 11 : currentMonth - 1; // the month
    if (tempYear >= 2018) { // we can't go below 2018
        currentYear = tempYear;
        currentMonth = tempMonth;
        showCalendar(currentMonth, currentYear); // actualize the calendar
    }
}

function jump() { // change the month and/or the year of the calendar
    currentYear = parseInt(selectYear.value);
    currentMonth = parseInt(selectMonth.value);
    showCalendar(currentMonth, currentYear);
}

function showCalendar(month, year) { // show the calendar on the HTML page
    let firstDay = (new Date(year, month)).getDay(); // the number of the days in the week in which the month begins
    if (firstDay === 0) {
        firstDay = 7;
    }
    let daysInMonth = 32 - new Date(year, month, 32).getDate(); // the amount of days in the month

    let previousYear = month === 0 ? (year - 1) : year;
    let previousMonth = month === 0 ? 12 : (month - 1);
    let daysInPreviousMonth = 32 - new Date(previousYear, previousMonth, 32).getDate();

    let tbl = document.getElementById("calendar-body"); // body of the calendar

    tbl.innerHTML = ""; // clearing all previous cells

    monthAndYear.innerHTML = months[month] + " " + year; // filling the calendar title by the date
    selectYear.value = year; // filling the actual calendar year in the selection menu
    selectMonth.value = month; // filling the actual calendar month in the selection menu

    // creating all cells
    let date = 1;

    for (let i = 0; i < 6; i++) {
        if (date > daysInMonth) { // break if we have created a cell for all days in the month
            break;
        }
        // creates a table row
        let row = document.createElement("tr");
        row.classList.add("highlight");

        for (let j = 0; j < 7; j++) { //creating individual cells, filing them up with data
            if (date > daysInMonth) { // we going to fill the rest empty cells in the month with nothing but a CSS style when hover
                for(let k = 0; k < 7 - j; k++) {
                    let cell = document.createElement("td");
                    let cellText = null;
                    cellText = document.createTextNode(k + 1);
                    cell.classList.add("calendarCell");
                    cell.classList.add("hightlightOnEmpty");
                    cell.appendChild(cellText); // adding the text into the cell
                    row.appendChild(cell); // adding the cell to the actual row
                }
                break;
            } if (j === 0) { // the first cell, this is the week number in the year
                let cell = document.createElement("td");
                let actual = new Date(year,month,date);
                let cellText = null;
                if ((date === 1) && (firstDay === 7)) {
                    cellText = document.createTextNode(actual.getWeek() - 1);
                } else {
                    cellText = document.createTextNode(actual.getWeek());
                }
                cell.classList.add("calendarLeftColumn");
                cell.appendChild(cellText); // adding the text into the cell
                cell.addEventListener("click", function(){ // on click we show the week's agenda
                    if (selectedSecondWeek === null) {
                        selectAWeek(year, month, i);
                    } else {
                        selectAWeek(year, month, i, 2);
                    }
                });
                row.appendChild(cell); // adding the cell to the actual row
            } if (i === 0 && j < firstDay - 1) { // we going to fill the firsts empty cells with nothing but a CSS style when hover as the rest of cells in the month
                let cell = document.createElement("td");
                let cellText = null;
                cellText = document.createTextNode(daysInPreviousMonth - firstDay + 2 + j);
                cell.classList.add("calendarCell", "hightlightOnEmpty");
                cell.appendChild(cellText); // adding the text into the cell
                row.appendChild(cell); // adding the cell to the actual row
            } else { // the cells with the day number in each
                let cell = document.createElement("td");
                let span = document.createElement("span");
                span.classList.add("numOfCalendarCell");
                let cellText = document.createTextNode(date);
                span.appendChild(cellText);
                span.addEventListener("click", function(){ // on click we show the week's agenda
                    selectADay(year, month, this.textContent);
                });

                if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                    cell.classList.add("actualDay");
                } // color today's date
                else {
                    cell.classList.add("highlightCell");
                }
                cell.classList.add("calendarCell");
                cell.appendChild(span); // adding the text into the cell
                row.appendChild(cell); // adding the cell to the actual row
                date++;
            }
        }
        tbl.appendChild(row); // appending each row into calendar body.
    }
}

function pad(d) { // transform a one-item digit to a two-item digit
    return (d < 10) ? '0' + d.toString() : d.toString();
}

function selectADay(year, month, day) { // we select a day to print
    removeCardSelection(); // remove the option of select one week or two weeks

    selectedSecondWeek = null; // we reset the second week selected
    removeCardDeletModifComment(); // remove the option of deletion, modification and comment

    document.getElementById("selectedWeek").innerHTML = ""; // reset the location where we will show the agenda day
    let tbl = document.getElementById("selectedWeek"); // the location where we will show the agenda day
    let selectedDay = year+"-"+pad(month+1)+"-"+pad(day);
    if (new Date(month+1 + " " + day + ", " + year).getDay() !== 0) {
        tbl.appendChild(printSelectedDay(selectedDay)); // add the div to the departure div
        setCardInsertion("day", selectedDay); // set the card insertion to this specific day
    } else {
        removeCardInsertion(); // remove the option of insertion
        printRules(); // print the main menu with possibilities of seeing rules
    }
    typeOfSelection = {"day": selectedDay}; // the option selected is the day
}

function printSelectedDay(selectedDay) {
    let general = {"INFO 1": [], "INFO 2": [], "1-A": [], "1-B": [], "1-C": [], "2-A": [], "2-B": [], "2-C": []}; // each info section
    let oneWeek = {"1-A-1" : [], "1-A-2" : [], "1-B-1" : [], "1-B-2" : [], "1-C-1" : [], "1-C-2" : [], "2-A-1" : [], "2-A-2" : [], "2-B-1" : [], "2-B-2" : [], "2-C-1" : [], "2-C-2" : [], "LP DIOC" : []}; // each info group

    let container = document.createElement("div"); // the principal container
    container.classList.add("container-fluid");

    let div = document.createElement("div"); // the div that will contains the agenda
    div.classList.add("card");

    let title = document.createElement("h3"); // the title that is the exact date of each day
    title.classList.add("card-header");
    title.classList.add("dayOfWeek");

    let datesOfWeek = printDatesOfWeek(selectedDay); // array with each element of the day's date
    for(let i = 0; i < monthsEN.length; i++) { // set the english month to the french month
        if (monthsEN[i] === datesOfWeek[2]) {
            datesOfWeek[2] = months[i];
            break;
        }
    }
    let text = document.createTextNode(datesOfWeek[0] + " " + datesOfWeek[1] + " " + datesOfWeek[2] + " " + datesOfWeek[3]); // the exact date of the day i

    title.appendChild(text); // add the text to the title location
    div.appendChild(title); // add this title to the div

    for(let j = 0; j < edt.length; j++) { // for each element of the edt imported
        let dateOfEdt = edt[j]["heure"].split(" ")[0]; // the date of the edt element

        if ((inWhichEdtTarget != null) && (inWhichEdtTarget.length == 2)) { // we selected to see a specific edt
            if (((inWhichEdtTarget[0] === "profs") && (inWhichEdtTarget[1] === getNameOfJSON(edt[j]["idprof"], profs))) || ((inWhichEdtTarget[0] === "salles") && (inWhichEdtTarget[1] === getNameOfJSON(edt[j]["idsalle"], salles))) || ((inWhichEdtTarget[0] === "matieres") && (inWhichEdtTarget[1] === getNameOfJSON(edt[j]["idmatiere"], matieres)))) { // if the schedule matches with what we want to see (a teacher, a classroom, a school subject)
                if (selectedDay == dateOfEdt) { // if both dates coincide
                    for(let k = 0; k < groupes.length; k++) { // for each group from datas imported
                        if (groupes[k]["id"] === edt[j]["idgroupe"]) { // if the id group of the group table coincide with the id group of the edt table
                            if (groupes[k]["nom"]==="INFO 1") { // if the schedule is for INFO 1, we add this for all group of INFO 1
                                general["INFO 1"].push(edt[j]);
                            } else if (groupes[k]["nom"]==="INFO 2") { // if the schedule is for INFO 2, we add this for all group of INFO 2
                                general["INFO 2"].push(edt[j]);
                            } else if (groupes[k]["nom"].includes("groupe")) {
                                let g = groupes[k]["nom"].split(" ")[1]; // the name group for the schedule
                                if (g.length === 3) { // if the schedule is for INFO 1-A, we add this for all group of INFO 1-A
                                    general[g].push(edt[j]);
                                } else { // the subgroup is already indicate so we can add this immediatly
                                    oneWeek[groupes[k]["nom"].split(" ")[1]].push(edt[j]);
                                }
                            } else { // we add the schedule to LP DIOC
                                oneWeek[groupes[k]["nom"]].push(edt[j]);
                            }
                        }
                    }
                }
            }
        } else { // we want to see the general edt
            if (selectedDay == dateOfEdt) { // if both dates coincide
                for(let k = 0; k < groupes.length; k++) { // for each group from datas imported
                    if (groupes[k]["id"] === edt[j]["idgroupe"]) { // if the id group of the group table coincide with the id group of the edt table
                        if (groupes[k]["nom"]==="INFO 1") { // if the schedule is for INFO 1, we add this for all group of INFO 1
                            general["INFO 1"].push(edt[j]);
                        } else if (groupes[k]["nom"]==="INFO 2") { // if the schedule is for INFO 2, we add this for all group of INFO 2
                            general["INFO 2"].push(edt[j]);
                        } else if (groupes[k]["nom"].includes("groupe")) {
                            let g = groupes[k]["nom"].split(" ")[1]; // the name group for the schedule
                            if (g.length === 3) { // if the schedule is for INFO 1-A, we add this for all group of INFO 1-A
                                general[g].push(edt[j]);
                            } else { // the subgroup is already indicate so we can add this immediatly
                                oneWeek[groupes[k]["nom"].split(" ")[1]].push(edt[j]);
                            }
                        } else { // we add the schedule to LP DIOC
                            oneWeek[groupes[k]["nom"]].push(edt[j]);
                        }
                    }
                }
            }
        }
    }
    let table = document.createElement("table");
    constructEdt(table); // construction of the agenda skeleton
    finishEdt(oneWeek, general, table, selectedDay); // add the schedule to the agenda skeleton
    div.appendChild(table); // add the table to the div
    container.appendChild(div);
    return container;
}

function selectAWeek(year, month, indice, type = 1) { // action when we select a week
    if (type === 1) { // we select to see only one week
        selectedSecondWeek = null; // reset the second week
        removeCardSelection(); // remove the option of select one week or two weeks
        removeCardDeletModifComment(); // remove the possibilities of deletion, modification and comment

        selectedWeek = []; // array with the days of the week as content
        let row = document.getElementById("calendar-body").rows[indice].getElementsByClassName("calendarCell"); // an array with the number of days of the week
    
        for(let i = 0; i < 6; i++) { // for each cell of the row
            let content = row[i].textContent; // get the content of the cell
            if ((indice === 0) && (parseInt(content) > 10)) { // if it's the day of the precedent month
                let previousYear = month === 0 ? (year - 1) : year; // the year of the precedent month
                let previousMonth = month === 0 ? 11 : (month - 1); // the month of the precedent month
                selectedWeek.push(previousYear+"-"+pad(previousMonth+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            } else if ((indice > 1) && (parseInt(content) < 10)) { // if it's not the day of the precedent month
                let nextYear = month === 11 ? (year + 1) : year;
                let nextMonth = month === 11 ? 0 : (month + 1);
                selectedWeek.push(nextYear+"-"+pad(nextMonth+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            } else if (content !== "") { // the cell's content is empty
                selectedWeek.push(year+"-"+pad(month+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            }
        }

        if (selectedWeek.length !== 0) { // if the week selected is not empty we set the possibilities to select two weeks
            let div = document.getElementById("cardSelection");
            div.innerHTML = "";
            div.style.visibility = "visible";
            div.style.marginTop = "2rem";
            let h3 = document.createElement("h3");
            h3.classList.add("card-header", "selectionType");
            let span = document.createElement("span");
            span.id = "typeOfSelection";
            let cellText = document.createTextNode("Selection");
            span.appendChild(cellText);
            h3.appendChild(span);
            div.appendChild(h3);
            let select = document.createElement("select");
            select.classList.add("custom-select");
            select.setAttribute("onchange", "selectionType(this.value)");
            let option1 = document.createElement("option");
            option1.value = "1";
            let textO1 = document.createTextNode("1 semaine");
            option1.appendChild(textO1);
            let option2 = document.createElement("option");
            option2.value = "2";
            let textO2 = document.createTextNode("2 semaines");
            option2.appendChild(textO2);
            select.appendChild(option1);
            select.appendChild(option2);
            div.appendChild(select);

            typeOfSelection = {"1 week": selectedWeek}; // type of selection is only one week
        }
    }
    let tbl = document.getElementById("selectedWeek"); // the location where we will show the agenda week
    tbl.innerHTML = ""; // reset the location where we will show the agenda week
    tbl.appendChild(printSelectedWeek(selectedWeek)); // we continue the action in an other function, we going to show it on the HTML page

    if (type === 2) { // the type of selection is two weeks
        selectedSecondWeek = []; // set the second week array
        removeCardDeletModifComment(); // remove the possibilities to modify, delete and comment
        let row = document.getElementById("calendar-body").rows[indice].getElementsByClassName("calendarCell"); // an array with the number of days of the week
        for(let i = 0; i < 6; i++) { // for each cell of the row
            let content = row[i].textContent; // get the content of the cell
            if ((indice === 0) && (parseInt(content) > 10)) { // if it's the day of the precedent month
                let previousYear = month === 0 ? (year - 1) : year; // the year of the precedent month
                let previousMonth = month === 0 ? 11 : (month - 1); // the month of the precedent month
                selectedSecondWeek.push(previousYear+"-"+pad(previousMonth+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            } else if ((indice > 1) && (parseInt(content) < 10)) { // if it's not the day of the precedent month
                let nextYear = month === 11 ? (year + 1) : year;
                let nextMonth = month === 11 ? 0 : (month + 1);
                selectedSecondWeek.push(nextYear+"-"+pad(nextMonth+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            } else if (content !== "") { // the cell's content is empty
                selectedSecondWeek.push(year+"-"+pad(month+1)+"-"+pad(row[i].textContent)); // push the exact date of each day in the row
            }
        }

        if ((selectedWeek[0] !== selectedSecondWeek[0]) && (selectedSecondWeek.length !== 0)) { // if both weeks are not the same
            tbl.appendChild(printSelectedWeek(selectedSecondWeek)); // we continue the action in another function, we going to show it on the HTML page
            typeOfSelection = {"2 weeks": [selectedWeek, selectedSecondWeek]}; // the type of selection is two weeks style
        }
    }
    setCardInsertion("weeks", [selectedWeek, selectedSecondWeek]); // set the possibilities to insert in the two weeks
}

function printSelectedWeek(week) { // print the week selected
    let div = document.createElement("div"); // the div that will contains the week
    div.classList.add("oneWeek");
    for(let i = 0; i < week.length; i++) { // for each day of the week
        div.appendChild(printSelectedDay(week[i])); // add the day div to the departure div
    }
    return div;
}

function selectAMonth() { // action when we select a month
    removeCardSelection(); // remove the possibilities to select one or two weeks

    selectedSecondWeek = null; // reset the second week
    removeCardDeletModifComment(); // remove the possibilities to delete, modify and comment

    document.getElementById("selectedWeek").innerHTML = ""; // reset the location where we will show the agenda week
    let selectedMonth = []; // array with the weeks of the month as content

    let y = parseInt(selectYear.value); // the year of the date
    let m = parseInt(selectMonth.value); // the month

    for(let i = 0; i < document.getElementById("calendar-body").rows.length; i++) { // for each day of the month printed
        let row = document.getElementById("calendar-body").rows[i].getElementsByClassName("calendarCell"); // an array with the number of days of the week
        let thisWeek = []; // the actual week
        for(let j = 0; j < 6; j++) { // for each day of the week
            let content = row[j].textContent; // get the content of the cell
            if ((i === 0) && (parseInt(content) > 10)) { // if it's the day of the precedent month
                let previousYear = m === 0 ? (y - 1) : y; // the year of the precedent month
                let previousMonth = m === 0 ? 11 : (m - 1); // the month of the precedent month
                thisWeek.push(previousYear+"-"+pad(previousMonth+1)+"-"+pad(row[j].textContent)); // push the exact date of each day in the row
            } else if ((i > 1) && (parseInt(content) < 10)) { // if it's not the day of the precedent month
                let nextYear = m === 11 ? (y + 1) : y;
                let nextMonth = m === 11 ? 0 : (m + 1);
                thisWeek.push(nextYear+"-"+pad(nextMonth+1)+"-"+pad(row[j].textContent)); // push the exact date of each day in the row
            } else if (content !== "") { // the cell's content is empty
                thisWeek.push(y+"-"+pad(m+1)+"-"+pad(row[j].textContent)); // push the exact date of each day in the row
            }
        }
        selectedMonth.push(thisWeek); // push this week into the actual month array
    }
    setCardInsertion("month", selectedMonth); // set the possibilities to insert in this month
    printSelectedMonth(selectedMonth); // print the month edt
    typeOfSelection = {"month": selectedMonth}; // set the type of selection to month
}

function printSelectedMonth(selectedMonth) { // print the month
    let tbl = document.getElementById("selectedWeek"); // the location where we will show the agenda week

    for(let i = 0; i < selectedMonth.length; i++) { // for each week of the month
        tbl.appendChild(printSelectedWeek(selectedMonth[i])); // add to the div the week to print
    }
}

function printDatesOfWeek(o) { // return the complete date of the i day in the week
    let y = o.substring(0,4); // the year
    let m = monthsEN[o.substring(5,7) - 1]; // the month
    let d = o.substring(8,10); // the day
    let j = (new Date(m + " " + d + ", " + y).getDay()); // the day of the week
    return [days[j - 1], d, m, y];
}

function constructEdt(table) { // construct the agenda skeleton
    table.classList.add("table", "table-bordered", "table-responsive-lg");
    table.id = "edt";

    let thead = document.createElement("thead"); // the head of the agenda
    let tr = document.createElement("tr"); // the first row

    let th = document.createElement("th"); // the first th cell that contains the word "Groupes"
    th.classList.add("edtLeftColumn");
    th.colSpan = "3"; // the width of the cell
    let text = document.createTextNode("Groupes");
    th.appendChild(text); // add the text to the cell
    tr.appendChild(th); // add the cell to the row

    for(let i = 0; i < hours.length; i++) { // for each hour of school day
        let th = document.createElement("th"); // we create a cell that contains the hour of courses
        th.classList.add("edtRowSup");
        th.colSpan = "4"; // the width of the cell
        let text = document.createTextNode(hours[i]);
        th.appendChild(text); // add the text to the cell
        tr.appendChild(th); // add the cell to the row
    }
    thead.appendChild(tr); // we add the row to the head of the agenda
    table.appendChild(thead); // we add this head to the agenda
}

function finishEdt(oneWeek, general, table, dayDate) { // add the schedule to the agenda skeleton
    let tbody = document.createElement("tbody"); // the body of the agenda
    tbody.classList.add("edt-body");

    for(let key in oneWeek) { // for each group of INFO
        let tr = document.createElement("tr"); // create a row
        let td = document.createElement("td"); // create a cell
        td.classList.add("edtLeftColumn");
        td.colSpan = "3"; // the width of the cell
        let text = document.createTextNode(key);
        td.appendChild(text); // add the group word to the cell
        tr.appendChild(td); // add the cell to the row
        let nbCell = 0; // the count of row's cell
        let actualSdl = new Date(dayDate+"T08:00:00"); // we will only use the hours of this date
        while(nbCell <= 39) { // while there is more cell to fill
            let haveDone = false;
            if ((key === "1-A-1") || (key === "2-A-1")) {
                let temp = "INFO " + key.split("-")[0];
                for(let i = 0; i < general[temp].length; i++) {
                    if ((general[temp][i]["heure"].split(" ")[1] === pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())) && (haveDone === false)) { // if it's a promo schedule
                        td = document.createElement("td");
                        td.addEventListener('contextmenu', (e)=>{ // right click on the cell
                            e.preventDefault();
                            setCardDeletModifComment(general[temp][i]); // set possibilities to delete, modify and put comments
                            return;
                        })
                        td.classList.add(general[temp][i]["type"].toLowerCase());
                        td.classList.add("agendaCellFill");
                        td.setAttribute("draggable", "true"); // can drag and drop
                        td.id = general[temp][i]["heure"].split(" ")[0]+"/"+general[temp][i]["heure"].split(" ")[1]+"/"+general[temp][i]["idgroupe"];
                        td.setAttribute("ondragstart", "drag(event)");
                        td.setAttribute("ondragover", "allowDrop(event)");
                        td.setAttribute("ondrop", "drop(event)");
                        if (general[temp][i]["duree"] !== undefined) { // the width of the cell that will depends on the duration of the course
                            td.colSpan = (general[temp][i]["duree"] / 15).toString();
                        } else {
                            td.colSpan = "6";
                        }
                        td.rowSpan = "6"; // the height of the cell
                        let m = null;
                        let p = null;
                        let s = null;
                        for (let j = 0; j < matieres.length; j++) { // search for the school subject
                            if (matieres[j]["id"] === general[temp][i]["idmatiere"]) {
                                m = matieres[j]["nom"];
                            }
                        }
                        for (let j = 0; j < profs.length; j++) {
                            if (profs[j]["id"] === general[temp][i]["idprof"]) { // search for the teacher
                                p = profs[j]["nom"];
                            }
                        }
                        for (let j = 0; j < salles.length; j++) {
                            if (salles[j]["id"] === general[temp][i]["idsalle"]) { // search for the classroom
                                s = salles[j]["nom"];
                            }
                        }
                        let span = document.createElement("span");
                        span.classList.add("cours", "infoBulle");
                        let text = document.createTextNode(general[temp][i]["type"] + " " + m); // first line of the cell text -> the type of the school subject and the school subject
                        span.setAttribute("aria-label", m)
                        span.appendChild(text);

                        span.addEventListener("click", function() { // click on this text -> see all schedules that match
                            selectSpecial("matieres", m);
                        });

                        td.appendChild(span);
    
                        td.appendChild(document.createElement("br"));
    
                        span = document.createElement("span");
                        span.classList.add("details", "infoBulle");
                        text = document.createTextNode(s + " "); // second line of the cell text -> the classroom
                        span.setAttribute("aria-label", s)
                        span.appendChild(text);

                        span.addEventListener("click", function() { // click on this text -> see all schedules that match
                            selectSpecial("salles", s);
                        });

                        td.appendChild(span);

                        span = document.createElement("span");
                        span.classList.add("details", "infoBulle");
                        text = document.createTextNode(p); // third line of the cell text -> the teacher
                        span.setAttribute("aria-label", p)
                        span.appendChild(text);

                        span.addEventListener("click", function() { // click on this text -> see all schedules that match
                            selectSpecial("profs", p);
                        });

                        td.appendChild(span);

                        td.addEventListener("click", function() { // click on this cell will show all other cell that will match with the same type of school subject
                            seeSameType(general[temp][i]["type"].toLowerCase());
                        });
    
                        tr.appendChild(td);
                        
                        if (general[temp][i]["duree"] !== undefined) { // if the duration of the course is defined
                            nbCell = nbCell + (general[temp][i]["duree"] / 15) - 1; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + general[temp][i]["duree"]); // add the correspond minutes to the actual schedule
                        } else {
                            nbCell = nbCell + 5; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + 90); // add the correspond minutes to the actual schedule
                        }
                        haveDone = true;
                    }
                }
            } else if (key !== "LP DIOC") { // if the row is not for LP DIOC
                let temp = "INFO " + key.split("-")[0];
                for(let i = 0; i < general[temp].length; i++) {
                    if ((general[temp][i]["heure"].split(" ")[1] === pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())) && (haveDone === false)) { // if it's a group schedule and the schedules coincide
                        if (general[temp][i]["duree"] !== undefined) { // if the duration of the course is defined
                            nbCell = nbCell + (general[temp][i]["duree"] / 15) - 1; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + general[temp][i]["duree"]); // add the correspond minutes to the actual schedule
                        } else {
                            nbCell = nbCell + 5; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + 90); // add the correspond minutes to the actual schedule
                        }
                        haveDone = true;
                    }
                }
            }
            let groupPart = key.split("-")[1] + "-" + key.split("-")[2];
            if ((groupPart === "A-1") || (groupPart === "B-1") || (groupPart === "C-1")) {
                let temp = key.split("-")[0] + "-" + key.split("-")[1];
                for(let i = 0; i < general[temp].length; i++) {
                    if ((general[temp][i]["heure"].split(" ")[1] === pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())) && (haveDone === false)) { // if it's a full group schedule
                        td = document.createElement("td");
                        td.addEventListener('contextmenu', (e)=>{ // right click on the cell
                            e.preventDefault();
                            setCardDeletModifComment(general[temp][i]); // set possibilities to delete, modify and put comments
                            return;
                        })
                        td.classList.add(general[temp][i]["type"].toLowerCase());
                        td.classList.add("agendaCellFill");
                        td.setAttribute("draggable", "true"); // drag and drop
                        td.id = general[temp][i]["heure"].split(" ")[0]+"/"+general[temp][i]["heure"].split(" ")[1]+"/"+general[temp][i]["idgroupe"];
                        td.setAttribute("ondragstart", "drag(event)");
                        td.setAttribute("ondragover", "allowDrop(event)");
                        td.setAttribute("ondrop", "drop(event)");
                        if (general[temp][i]["duree"] !== undefined) { // set width of cell via duration
                            td.colSpan = (general[temp][i]["duree"] / 15).toString();
                        } else {
                            td.colSpan = "6";
                        }
                        td.rowSpan = "2"; // height cell for a full group
                        let m = null;
                        let p = null;
                        let s = null;
                        for (let j = 0; j < matieres.length; j++) {
                            if (matieres[j]["id"] === general[temp][i]["idmatiere"]) { // the school subject
                                m = matieres[j]["nom"];
                            }
                        }
                        for (let j = 0; j < profs.length; j++) {
                            if (profs[j]["id"] === general[temp][i]["idprof"]) { // the teacher
                                p = profs[j]["nom"];
                            }
                        }
                        for (let j = 0; j < salles.length; j++) {
                            if (salles[j]["id"] === general[temp][i]["idsalle"]) { // the classroom
                                s = salles[j]["nom"];
                            }
                        }
                        let span = document.createElement("span");
                        span.classList.add("cours", "infoBulle");
                        let text = document.createTextNode(general[temp][i]["type"] + " " + m); // first line of the cell text -> the type of the school subject and the school subject
                        span.setAttribute("aria-label", m)
                        span.appendChild(text);

                        span.addEventListener("click", function() { // click on this text -> see all schedules that match
                            selectSpecial("matieres", m);
                        });

                        td.appendChild(span);
    
                        td.appendChild(document.createElement("br"));
    
                        span = document.createElement("span");
                        span.classList.add("details", "infoBulle");
                        text = document.createTextNode(s + " "); // second line is the classroom
                        span.setAttribute("aria-label", s)
                        span.appendChild(text);
                        
                        span.addEventListener("click", function() {
                            selectSpecial("salles", s); // click on this text -> see all schedules that match
                        });

                        td.appendChild(span);

                        span = document.createElement("span");
                        span.classList.add("details", "infoBulle");
                        text = document.createTextNode(p); // third line is the teacher
                        span.setAttribute("aria-label", p)
                        span.appendChild(text);
                        
                        span.addEventListener("click", function() { // click on this text -> see all schedules that match
                            selectSpecial("profs", p);
                        });

                        td.appendChild(span);

                        td.addEventListener("click", function() { // click on this cell will show all other cell that will match with the same type of school subject
                            seeSameType(general[temp][i]["type"].toLowerCase());
                        });
    
                        tr.appendChild(td);
                        if (general[temp][i]["duree"] !== undefined) { // add the number of cells used and the duration of courses to the actual schedule day
                            nbCell = nbCell + (general[temp][i]["duree"] / 15) - 1;
                            actualSdl.setMinutes(actualSdl.getMinutes() + general[temp][i]["duree"]);
                        } else {
                            nbCell = nbCell + 5;
                            actualSdl.setMinutes(actualSdl.getMinutes() + 90);
                        }
                        haveDone = true;
                    }
                }
            } else if (key !== "LP DIOC") { // if the row is not for LP DIOC
                let temp = key.split("-")[0] + "-" + key.split("-")[1];
                for(let i = 0; i < general[temp].length; i++) {
                    if ((general[temp][i]["heure"].split(" ")[1] === pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())) && (haveDone === false)) { // if it's a group schedule and the schedules coincide
                        if (general[temp][i]["duree"] !== undefined) { // if the duration of the course is defined
                            nbCell = nbCell + (general[temp][i]["duree"] / 15) - 1; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + general[temp][i]["duree"]); // add the correspond minutes to the actual schedule
                        } else {
                            nbCell = nbCell + 5; // add the correspond number of cell
                            actualSdl.setMinutes(actualSdl.getMinutes() + 90); // add the correspond minutes to the actual schedule
                        }
                        haveDone = true;
                    }
                }
            }
            for(let i = 0; i < oneWeek[key].length; i++) { // simply add the schedule for this specific group
                if ((oneWeek[key][i]["heure"].split(" ")[1] === pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())) && (haveDone === false)) {
                    td = document.createElement("td");
                    td.addEventListener('contextmenu', (e)=>{ // right click on the cell
                        e.preventDefault();
                        setCardDeletModifComment(oneWeek[key][i]); // possibilities to modify, delete, comment
                        return;
                    })
                    td.classList.add(oneWeek[key][i]["type"].toLowerCase());
                    td.classList.add("agendaCellFill");
                    td.setAttribute("draggable", "true"); // drag and drop
                    td.id = oneWeek[key][i]["heure"].split(" ")[0]+"/"+oneWeek[key][i]["heure"].split(" ")[1]+"/"+oneWeek[key][i]["idgroupe"];
                    td.setAttribute("ondragstart", "drag(event)");
                    td.setAttribute("ondragover", "allowDrop(event)");
                    td.setAttribute("ondrop", "drop(event)");
                    if (oneWeek[key][i]["duree"] !== undefined) { // set width of cell via duration
                        td.colSpan = (oneWeek[key][i]["duree"] / 15).toString();
                    } else {
                        td.colSpan = "6";
                    }
                    let m = null;
                    let p = null;
                    let s = null;
                    for (let j = 0; j < matieres.length; j++) { // set school subject
                        if (matieres[j]["id"] === oneWeek[key][i]["idmatiere"]) {
                            m = matieres[j]["nom"];
                        }
                    }
                    for (let j = 0; j < profs.length; j++) { // set teacher
                        if (profs[j]["id"] === oneWeek[key][i]["idprof"]) {
                            p = profs[j]["nom"];
                        }
                    }
                    for (let j = 0; j < salles.length; j++) { // set classroom
                        if (salles[j]["id"] === oneWeek[key][i]["idsalle"]) {
                            s = salles[j]["nom"];
                        }
                    }
                    let span = document.createElement("span");
                    span.classList.add("cours", "infoBulle");
                    let text = document.createTextNode(oneWeek[key][i]["type"] + " " + m); // first line -> school subject and his type
                    span.setAttribute("aria-label", m)
                    span.appendChild(text);

                    span.addEventListener("click", function() { // click on this text will only print the schedule with the same school subject
                        selectSpecial("matieres", m);
                    });
                    
                    td.appendChild(span);

                    td.appendChild(document.createElement("br"));

                    span = document.createElement("span");
                    span.classList.add("details", "infoBulle");
                    text = document.createTextNode(s + " "); // first line -> classroom
                    span.setAttribute("aria-label", s)
                    span.appendChild(text);
                        
                    span.addEventListener("click", function() { // click on this text will only print the schedule with the same classroom
                        selectSpecial("salles", s);
                    });

                    td.appendChild(span);

                    span = document.createElement("span");
                    span.classList.add("details", "infoBulle");
                    text = document.createTextNode(p); // first line -> teacher
                    span.setAttribute("aria-label", p)
                    span.appendChild(text);
                        
                    span.addEventListener("click", function() { // click on this text will only print the schedule with the same teacher
                        selectSpecial("profs", p);
                    });

                    td.appendChild(span);

                    td.addEventListener("click", function() { // click on the cell will put forward the schedule with the same type
                        seeSameType(oneWeek[key][i]["type"].toLowerCase());
                    });

                    tr.appendChild(td);
                    if (oneWeek[key][i]["duree"] !== undefined) { // add the correspond cell and duration
                        nbCell = nbCell + (oneWeek[key][i]["duree"] / 15) - 1;
                        actualSdl.setMinutes(actualSdl.getMinutes() + oneWeek[key][i]["duree"]);
                    } else {
                        nbCell = nbCell + 5;
                        actualSdl.setMinutes(actualSdl.getMinutes() + 90);
                    }
                    haveDone = true;
                }
            }
            if (!haveDone) { // add an empty cell
                td = document.createElement("td");
                td.appendChild(document.createElement("p"));
                td.appendChild(document.createElement("br"));
                td.appendChild(document.createElement("p"));
                td.id = dayDate+"/"+pad(actualSdl.getHours().toString())+":"+pad(actualSdl.getMinutes().toString())+":"+pad(actualSdl.getSeconds().toString())+"/num_"+key.split("-")[0]+"-";
                td.classList.add("cellAgendaEmpty");
                td.setAttribute("ondragover", "allowDrop(event)"); // drag an element on this cell
                td.setAttribute("ondrop", "drop(event)"); // drop an element on this cell
                if (pad(actualSdl.getMinutes().toString()) === "00") {
                    td.classList.add("agendaCellSplit");
                } else {
                    td.classList.add("agendaCell");
                }
                actualSdl.setMinutes(actualSdl.getMinutes() + 15); // add the duration
                tr.appendChild(td);
            }
            nbCell++; // add the cell used
        }
        tbody.appendChild(tr); // we add the row to the agenda body
    }
    table.appendChild(tbody); // we add this body to the agenda
}

function seeSameType(type) { // function to see the schedules with the same type of course
    let types = ["ds", "cm", "td", "tp"]; // the different types
    let elements = document.getElementsByClassName(type);
    if (elements[0].style.opacity === "1") {
        for(let i = 0; i < types.length; i++) {
            if (type !== types[i]) {
                let elements = document.getElementsByClassName(types[i]);
                for(let element of elements) { // set the opacity to 1 to the elements chosen, and 0.2 to others
                    if (element.style.opacity === "1") {
                        element.style.opacity = "0.2";
                    } else {
                        element.style.opacity = "1";
                    }
                }
            }
        }
    } else { // set opacity of all the elements to 1
        for(let i = 0; i < types.length; i++) {
            let elements = document.getElementsByClassName(types[i]);
            for(let element of elements) {
                element.style.opacity = "1";
            }
        }
    }
}

function selectionType(value) { // select one week or two weeks to see
    if (value === "2") { // we select a second week to print
        selectedSecondWeek = [];
    } else { // only one week to see
        selectedSecondWeek = null; // reset the second week
        let tbl = document.getElementById("selectedWeek");
        tbl.innerHTML = ""; // reset the edt printed
        tbl.appendChild(printSelectedWeek(selectedWeek)); // print the week selected
    }
    removeCardDeletModifComment(); // remove the possibilities to modify, delete, comment
}

function removeCardSelection() { // remove the card that allows to select the number of weeks
    let div = document.getElementById("cardSelection");
    div.innerHTML = "";
    div.style.visibility = "hidden";
    div.style.marginTop = "0rem";
}

function setCardDeletModifComment(schedule) { // set the card that give possibilities to modify, delete and add/remove comments by giving the schedule selected
    if (document.getElementById("cardDeletModifComment").innerHTML != "") { // remove this card if it's not empty
        removeCardDeletModifComment();
    } else {
        let cardDM = document.getElementById("cardDeletModifComment");
        cardDM.innerHTML = ""; // reset the card
        
        let buttonM = document.createElement("button"); // modification
        buttonM.type = "button";
        buttonM.classList.add("btn", "btn-outline-primary", "btn-block");
        let textM = document.createTextNode("Modifier");
        buttonM.appendChild(textM);
        buttonM.setAttribute("onclick", "modifySelectedSchedule()");
    
        let buttonD = document.createElement("button"); // deletion
        buttonD.type = "button";
        buttonD.classList.add("btn", "btn-outline-danger", "btn-block");
        let textD = document.createTextNode("Supprimer");
        buttonD.appendChild(textD);
        buttonD.setAttribute("onclick", "deleteSelectedSchedule()");
    
        let span = document.createElement("span"); // the course start and end times
        span.classList.add("specSchedule");
        let sStart = schedule["heure"].split(" ")[1];
        let sEnd = null;
        if (schedule["duree"] !== undefined) { // calcule the course end times -> if the duration is defined
            let dateEnd = new Date(schedule["heure"].split(" ")[0]+"T"+schedule["heure"].split(" ")[1]);
            dateEnd.setMinutes(dateEnd.getMinutes() + schedule["duree"]);
            sEnd = pad(dateEnd.getHours().toString())+":"+pad(dateEnd.getMinutes().toString())+":"+pad(dateEnd.getSeconds().toString())
        } else { // calcule the course end times -> if the duration is undefined
            let dateEnd = new Date(schedule["heure"].split(" ")[0]+"T"+schedule["heure"].split(" ")[1]);
            dateEnd.setMinutes(dateEnd.getMinutes() + 90);
            sEnd = pad(dateEnd.getHours().toString())+":"+pad(dateEnd.getMinutes().toString())+":"+pad(dateEnd.getSeconds().toString())
        }
        let textS = document.createTextNode(sStart + " - " + sEnd);
        span.appendChild(textS);

        let nbCom = searchNbCom(schedule); // number of comments set

        let buttonC = document.createElement("button"); // button to see and put comments
        buttonC.type = "button";
        buttonC.classList.add("btn", "btn-outline-dark", "btn-block");
        let textC = document.createTextNode("Commentaires (" + pad(nbCom) + ")");
        buttonC.appendChild(textC);
        buttonC.setAttribute("onclick", "commentOnSchedule()");

        cardDM.appendChild(buttonM);
        cardDM.appendChild(buttonD);
        cardDM.appendChild(span);
        cardDM.appendChild(buttonC);
        cardDM.style.visibility = "visible";
    
        scheduleToChange = schedule; // schedule to change thanks to a click on this one
    }
}

function removeCardDeletModifComment() { // remove the card that give possibilities to modify, delete and add/remove comments
    let cardD = document.getElementById("cardDeletModifComment");
    cardD.innerHTML = "";
    cardD.style.visibility = "hidden";
}

function setCardInsertion(word, schedule) { // set the card of insertion
    let cardI = document.getElementById("cardInsertion");
    cardI.innerHTML = ""; // reset this one
    
    let buttonI = document.createElement("button");
    buttonI.type = "button";
    buttonI.classList.add("btn", "btn-outline-success", "btn-block");
    let textI = document.createTextNode("Insérer");
    buttonI.appendChild(textI);
    buttonI.setAttribute("onclick", "insertSchedule()");

    cardI.appendChild(buttonI);
    cardI.style.visibility = "visible";

    scheduleToInsert = [word, schedule]; // set parameters for insertion -> the key and the schedule
}

function removeCardInsertion() { // remove the possibilities to insert a new schedule or multiple schedules
    let cardI = document.getElementById("cardInsertion");
    cardI.innerHTML = "";
    cardI.style.visibility = "hidden";
}

function deleteSelectedSchedule() { // delete the schedule selected
    if (!connected) { // the user must be logged in
        alert("Merci de vous connecter !");
        return;
    }
    deleteFromATab(edt, scheduleToChange); // delete from the edt datas
    history.push(["Suppression", [scheduleToChange].slice(), new Date(), userConnected]); // add to the history
    removeCommentOnScheduleAll(commentaires, [scheduleToChange].slice()); // remove the comments assigned
    checkDemandeDeplacement(deplacements, [scheduleToChange].slice()); // remove the remove request assigned
    printAfterModif(); // print modif
    removeCardDeletModifComment(); // remove possibilities of modification, deletion and comment
}

function deleteFromATab(tab, element) { // delete an edt element from a tab
    for(let i = 0; i < tab.length; i++) {
        if ((tab[i]["heure"] === element["heure"]) && (tab[i]["idgroupe"] === element["idgroupe"]) && (tab[i]["idmatiere"] === element["idmatiere"]) && (tab[i]["idprof"] === element["idprof"]) && (tab[i]["idsalle"] === element["idsalle"]) && (tab[i]["type"] === element["type"])) {
            tab.splice(i, 1);
            break;
        }
    }
}

function printAfterModif() { // print the edt after modification
    document.getElementById("selectedWeek").innerHTML = ""; // reset this one
    let tbl = document.getElementById("selectedWeek");

    if (typeOfSelection["day"] !== undefined) { // print according to the type of selection chosen
        tbl.appendChild(printSelectedDay(typeOfSelection["day"]));
    } else if (typeOfSelection["1 week"] !== undefined) {
        tbl.appendChild(printSelectedWeek(typeOfSelection["1 week"]));
    } else if (typeOfSelection["2 weeks"] !== undefined) {
        tbl.appendChild(printSelectedWeek(typeOfSelection["2 weeks"][0]));
        tbl.appendChild(printSelectedWeek(typeOfSelection["2 weeks"][1]));
    } else if (typeOfSelection["month"] !== undefined) {
        printSelectedMonth(typeOfSelection["month"]);
    }
}

function insertSchedule() { // insertion of schedule
    if (!connected) { // user must be logged in
        alert("Merci de vous connecter !");
        return;
    }
    document.querySelector(".popup").style.display = "flex"; // show popup and background opacity at 0.2
    document.getElementById("main").style.opacity = "0.2";

    document.getElementById("headerNav").style.pointerEvents = "none"; // impossibility to click on navbar and on background
    document.getElementById("main").style.pointerEvents = "none";
    document.body.style.overflow = "hidden";

    modifType = "Insertion";

    document.getElementById("nameOfModif").innerHTML = modifType; // set title of popup

    if (scheduleToInsert[0] === "day") { // preset value by the schedule selected
        document.querySelector('input[type="date"]').value = scheduleToInsert[1];
    } else if (scheduleToInsert[0] === "weeks") {
        document.querySelector('input[type="date"]').value = scheduleToInsert[1][0][0];
    } else if (scheduleToInsert[0] === "month") {
        document.querySelector('input[type="date"]').value = scheduleToInsert[1][0][0];
    }
    document.querySelector('input[type="time"]').value = "08:15";
    document.querySelector('input[type="number"]').value = 90;
    document.getElementById("inlineFormType").value = "DS";
    document.getElementById("inlineFormMatiere").value = "Projet Tuteuré";
    document.getElementById("inlineFormGroupe").value = "INFO 1";
    document.getElementById("inlineFormProfesseur").value = "A. Chafik";
    document.getElementById("inlineFormSalle").value = "11 E";
    document.getElementById("inlineFormNbWeek").value = 1;
}

function modifySelectedSchedule() { // modification
    if (!connected) { // user must be logged in
        alert("Merci de vous connecter !");
        return;
    }
    document.querySelector(".popup").style.display = "flex"; // show popup and background opacity at 0.2
    document.getElementById("main").style.opacity = "0.2";

    document.getElementById("headerNav").style.pointerEvents = "none"; // impossibility to click on navbar and on background
    document.getElementById("main").style.pointerEvents = "none";
    document.body.style.overflow = "hidden";

    modifType = "Modification";

    document.getElementById("nameOfModif").innerHTML = modifType; // set title of popup

    document.querySelector('input[type="date"]').value = scheduleToChange["heure"].split(" ")[0]; // preset value by the schedule selected
    document.querySelector('input[type="time"]').value = scheduleToChange["heure"].split(" ")[1];
    if (scheduleToChange["duree"] !== undefined) {
        document.querySelector('input[type="number"]').value = scheduleToChange["duree"];
    } else {
        document.querySelector('input[type="number"]').value = 90;
    }
    document.getElementById("inlineFormType").value = scheduleToChange["type"];
    document.getElementById("inlineFormMatiere").value = getNameOfJSON(scheduleToChange["idmatiere"], matieres);
    document.getElementById("inlineFormGroupe").value = getNameOfJSON(scheduleToChange["idgroupe"], groupes);
    document.getElementById("inlineFormProfesseur").value = getNameOfJSON(scheduleToChange["idprof"], profs);
    document.getElementById("inlineFormSalle").value = getNameOfJSON(scheduleToChange["idsalle"], salles);
    document.getElementById("inlineFormNbWeek").value = 1;
    removeCardDeletModifComment();
}

function removePopup() { // remove popup of modification or insertion
    document.querySelector(".popup").style.display = "none";
    document.getElementById("main").style.opacity = null;

    document.getElementById("headerNav").style.pointerEvents = null;
    document.getElementById("main").style.pointerEvents = null;
    document.body.style.overflow = null;
}

function modifyEdt() { // validate modification/insertion form
    let sched = null;

    document.getElementById("headerNav").style.pointerEvents = null; // reset possibility to click on navbar and on background
    document.getElementById("main").style.pointerEvents = null;
    document.body.style.overflow = null;

    let newDate = document.querySelector('input[type="date"]').value; // take values from the form
    let newTime = document.querySelector('input[type="time"]').value;
    if (newTime.length == 5) {
        newTime = document.querySelector('input[type="time"]').value+":00";
    }
    let newUntil = document.querySelector('input[type="number"]').value;
    if (newUntil < 15) {
        newUntil = 15;
    } else if (newUntil > 195) {
        newUntil = 195;
    }
    let realDate = new Date(newDate+"T"+newTime); // the course start times
    let untilDate = new Date(newDate+"T"+newTime); // the course end times
    untilDate.setMinutes(parseInt(realDate.getMinutes()) + parseInt(newUntil));
    let borderSup = new Date(newDate+"T"+newTime); // top border possible for schedule
    borderSup.setHours(17);
    borderSup.setMinutes(30);
    let borderInf = new Date(newDate+"T"+newTime); // bottom border possible for schedule
    borderInf.setHours(8);
    borderInf.setMinutes(15);

    if ((realDate.getDay() !== 0) && (untilDate <= borderSup) && (realDate >= borderInf)) { // if the schedule is correct (not sunday and schedule correct)
        let type = document.getElementById("inlineFormType").value;
        let matiere = getIdOfJSON(document.getElementById("inlineFormMatiere").value, matieres);
        let groupe = getIdOfJSON(document.getElementById("inlineFormGroupe").value, groupes);
        let professeur = getIdOfJSON(document.getElementById("inlineFormProfesseur").value, profs);
        let salle = getIdOfJSON(document.getElementById("inlineFormSalle").value, salles);

        if (newUntil == 90) { // construct the schedule array
            sched = {"heure": newDate + " " + newTime, "type": type, "idmatiere": matiere, "idgroupe": groupe, "idprof": professeur, "idsalle": salle};
        } else {
            sched = {"heure": newDate + " " + newTime, "duree": parseInt(newUntil), "type": type, "idmatiere": matiere, "idgroupe": groupe, "idprof": professeur, "idsalle": salle};
        }
    }
    if ((modifType == "Insertion") && (sched != null)) { // we want to insert a schedule
        if (document.getElementById("inlineFormNbWeek").value != 1) { // apply to a number of weeks
            let nb = parseInt(document.getElementById("inlineFormNbWeek").value); // number of weeks to insert courses
            let possible = true;
            let y = sched["heure"].split(" ")[0].substring(0,4);
            let m = monthsEN[sched["heure"].split(" ")[0].substring(5,7) - 1];
            let d = sched["heure"].split(" ")[0].substring(8,10);
            let elToInsert = []; // all the courses

            for(let i = 0; i < nb; i++) { // for each weeks
                let tmp = [JSON.parse(JSON.stringify(sched))]; // create a temporary schedule
                let date = new Date(m + " " + d + ", " + y);
                date.setDate(date.getDate() + (i*7));
                tmp[0]["heure"] = date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+" "+sched["heure"].split(" ")[1]; // set the date
                possible = possible && verifCoherence(tmp[0], edt); // check if it's always possible
                elToInsert.push(JSON.parse(JSON.stringify(tmp[0]))); // insert this course into the temporary schedule
            }
            if (!possible) { // alert that it's not possible to insert all of these courses
                alert("Cette insertion n'est pas possible pour les "+nb+" semaines ! Incohérence de l'emploi du temps.");
            } else {
                history.push(["Insertion "+nb, [sched].slice(), new Date(), userConnected]); // put it on the history
                for(let i = 0; i < nb; i++) {
                    insertToTab(elToInsert[i], edt); // insert all into the edt datas
                }
                removePopup(); // remove popup insertion
                printAfterModif(); // print modification
            }
        } else {
            if (verifCoherence(sched, edt)) { // verif if we can put this schedule in the edt
                history.push(["Insertion", [sched].slice(), new Date(), userConnected]); // put the modif in the history
                insertToTab(sched, edt); // insert into the edt datas
                removePopup(); // remove the popup of insertion
                printAfterModif(); // print modification
            } else { // alert that it's not possible to insert
                alert("Cette insertion n'est pas possible ! Incohérence de l'emploi du temps.");
            }
        }
    } else if ((modifType == "Modification") && (sched != null)) { // if it's a modification
        let edtTemp = JSON.parse(JSON.stringify(edt));
        if (document.getElementById("inlineFormNbWeek").value != 1) { // apply to a number of weeks
            let commentairesTemp = JSON.parse(JSON.stringify(commentaires)); // copy comments array
            let deplacementsTemp = JSON.parse(JSON.stringify(deplacements)); // copy move request array
            let nb = parseInt(document.getElementById("inlineFormNbWeek").value); // number of weeks modification
            let possible = true;

            let y1 = sched["heure"].split(" ")[0].substring(0,4); // the date of the course changed
            let m1 = monthsEN[sched["heure"].split(" ")[0].substring(5,7) - 1];
            let d1 = sched["heure"].split(" ")[0].substring(8,10);

            let y2 = scheduleToChange["heure"].split(" ")[0].substring(0,4); // the date of the basic course
            let m2 = monthsEN[scheduleToChange["heure"].split(" ")[0].substring(5,7) - 1];
            let d2 = scheduleToChange["heure"].split(" ")[0].substring(8,10);

            for(let i = 0; i < nb; i++) { // for each week
                let tmp1 = [JSON.parse(JSON.stringify(sched))];;
                let tmp2 = [JSON.parse(JSON.stringify(scheduleToChange))];;

                let date1 = new Date(m1 + " " + d1 + ", " + y1);
                date1.setDate(date1.getDate() + (i*7));
                let date2 = new Date(m2 + " " + d2 + ", " + y2);
                date2.setDate(date2.getDate() + (i*7));

                tmp1[0]["heure"] = date1.getFullYear()+"-"+pad(date1.getMonth()+1)+"-"+pad(date1.getDate())+" "+sched["heure"].split(" ")[1];
                tmp2[0]["heure"] = date2.getFullYear()+"-"+pad(date2.getMonth()+1)+"-"+pad(date2.getDate())+" "+scheduleToChange["heure"].split(" ")[1];
                
                /* delete from the temporary edt the basic course if exists, the comments and the move request assigned */

                let find = false;
                for(let i = 0; i < edtTemp.length; i++) {
                    if ((edtTemp[i]["heure"] === tmp2[0]["heure"]) && (edtTemp[i]["idgroupe"] === tmp2[0]["idgroupe"]) && (edtTemp[i]["idmatiere"] === tmp2[0]["idmatiere"]) && (edtTemp[i]["idprof"] === tmp2[0]["idprof"]) && (edtTemp[i]["idsalle"] === tmp2[0]["idsalle"]) && (edtTemp[i]["type"] === tmp2[0]["type"])) {
                        edtTemp.splice(i, 1);
                        removeCommentOnScheduleAll(commentairesTemp, [tmp2[0]].slice());
                        checkDemandeDeplacement(deplacementsTemp, [tmp2[0]].slice());
                        find = true;
                        break;
                    }
                }
                if (!find) { // the course at this week doesn't exists so we can't push it
                    possible = false;
                    break;
                }
                possible = possible && verifCoherence(tmp1[0], edtTemp); // check if we can push the course changed and we push it if we can
                if (possible){
                    insertToTab(tmp1[0], edtTemp);
                }
            }
            if (!possible) { // alert that we can't push all that courses
                alert("Cette modification n'est pas possible pour les "+nb+" semaines ! Incohérence de l'emploi du temps.");
            } else {
                if ((scheduleToChange["heure"] === sched["heure"]) && (scheduleToChange["duree"] === sched["duree"]) && (scheduleToChange["idgroupe"] === sched["idgroupe"]) && (scheduleToChange["idmatiere"] === sched["idmatiere"]) && (scheduleToChange["idprof"] === sched["idprof"]) && (scheduleToChange["idsalle"] === sched["idsalle"]) && (scheduleToChange["type"] === sched["type"])) { // if no modification is done
                    alert("Aucune modification à apportée !");
                } else {
                    history.push(["Modification "+nb, [scheduleToChange].slice(), [sched].slice(), new Date(), userConnected]); // add this modification to the history
                    edt = JSON.parse(JSON.stringify(edtTemp)); // apply to the basic edt
                    commentaires = commentairesTemp; // apply to the basic comments array
                    deplacements = deplacementsTemp; // apply to the basic remove requests array
                    removePopup(); // remove the modification popup
                    printAfterModif(); // print after modification(s)
                }
            }
        } else { // apply modification to only one week
            for(let i = 0; i < edtTemp.length; i++) { // remove from the temporary edt array the basic course
                if ((edtTemp[i]["heure"] === scheduleToChange["heure"]) && (edtTemp[i]["idgroupe"] === scheduleToChange["idgroupe"]) && (edtTemp[i]["idmatiere"] === scheduleToChange["idmatiere"]) && (edtTemp[i]["idprof"] === scheduleToChange["idprof"]) && (edtTemp[i]["idsalle"] === scheduleToChange["idsalle"]) && (edtTemp[i]["type"] === scheduleToChange["type"])) {
                    edtTemp.splice(i, 1);
                    break;
                }
            }
            if ((scheduleToChange["heure"] === sched["heure"]) && (scheduleToChange["duree"] === sched["duree"]) && (scheduleToChange["idgroupe"] === sched["idgroupe"]) && (scheduleToChange["idmatiere"] === sched["idmatiere"]) && (scheduleToChange["idprof"] === sched["idprof"]) && (scheduleToChange["idsalle"] === sched["idsalle"]) && (scheduleToChange["type"] === sched["type"])) { // if no modification is done
                alert("Aucune modification à apportée !");
            } else {
                if (verifCoherence(sched, edtTemp)) { // if we can push the modification in the tab, if it's consistent with the basic edt
                    deleteFromATab(edt, scheduleToChange); // remove from the basic edt the schedule changed
                    removeCommentOnScheduleAll(commentaires, [scheduleToChange].slice()); // remove all comments assigned at this schedule
                    checkDemandeDeplacement(deplacements, [scheduleToChange].slice()); // the same with remove requests
                    history.push(["Modification", [scheduleToChange].slice(), [sched].slice(), new Date(), userConnected]); // add the modification to the history
                    removeCardDeletModifComment(); // remove possibilities to modify, delete and add/remove comment(s)
                    insertToTab(sched, edt); // insert schedule changed into edt array
                    removePopup(); // remove modification popup
                    printAfterModif(); // directly print modification
                } else { // alert that it's not possible to apply modifications
                    alert("Cette modification n'est pas possible ! Incohérence de l'emploi du temps.");
                }
            }
        }
    } else { // there is a unknown error
        alert("Le cours que vous tentez de créer ne respecte pas les horaires de l'établissement.");
    }
}

function printRules() { // print the main menu and the possibilities to show rules from a popup
    let tbl = document.getElementById("selectedWeek");
    tbl.innerHTML = "";

    let card = document.createElement("div");
    card.classList.add("card", "text-white", "bg-dark", "mb-3", "w-100");
    card.id = "cardRules";
    card.style = "margin-right: 1rem;";
    let div1 = document.createElement("div");
    div1.classList.add("card-body");
    let h1 = document.createElement("h1");
    h1.classList.add("card-title", "text-center");
    let text1 = document.createTextNode("Bienvenue sur l'emploi du temps du département informatique de l'IUT de Lens");
    h1.appendChild(text1);
    div1.appendChild(h1);
    div1.appendChild(document.createElement("br"));
    let div2 = document.createElement("div");
    div2.classList.add("text-center");
    let buttonInfo = document.createElement("button");
    buttonInfo.type = "button";
    buttonInfo.classList.add("btn", "btn-info");
    buttonInfo.setAttribute("data-toggle", "modal");
    buttonInfo.setAttribute("data-target", "#exampleModalScrollable");
    buttonInfo.innerHTML = "Informations";
    div2.appendChild(buttonInfo);
    div1.appendChild(div2);
    div1.appendChild(setModalInfo());

    card.appendChild(div1);
    tbl.appendChild(card);
}

function setModalInfo() { // set the popup that contains the rules
    let modal = document.createElement("div");
    modal.classList.add("modal", "fade", "text-dark");
    modal.id = "exampleModalScrollable";
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "exampleModalScrollableTitle");
    modal.setAttribute("aria-hidden", "true");

    let modalDialog = document.createElement("div");
    modalDialog.classList.add("modal-dialog", "modal-dialog-scrollable");
    modalDialog.setAttribute("role", "document");

    let modalContent = document.createElement("div");
    modalContent.classList.add("modal-content");

    let modalHeader = document.createElement("div");
    modalHeader.classList.add("modal-header");
    let h5 = document.createElement("h5");
    h5.classList.add("modal-title");
    h5.id = "exampleModalScrollableTitle";
    h5.innerHTML = "Informations";
    let buttonClose = document.createElement("button"); // close the popup
    buttonClose.type = "button";
    buttonClose.classList.add("close");
    buttonClose.setAttribute("data-dismiss", "modal");
    buttonClose.setAttribute("aria-label", "Close");
    let spanClose = document.createElement("span");
    spanClose.setAttribute("aria-hidden", "true");
    spanClose.innerHTML = "&times;";
    buttonClose.appendChild(spanClose);
    modalHeader.appendChild(h5);
    modalHeader.appendChild(buttonClose);

    let modalBody = document.createElement("div");
    modalBody.classList.add("modal-body");

    let text1 = document.createTextNode("Sélection d'un jour en cliquant sur le numéro du jour.");
    let text2 = document.createTextNode("Sélection d'une semaine en cliquant sur le numéro de semaine. Possibilité de sélectionner ensuite une seconde semaine qui sera affichée à la droite de la première.");
    let text3 = document.createTextNode("Sélection d'un mois en cliquant sur le mois. Les semaines y sont affichées les une à côté des autres.");
    let text4 = document.createTextNode("Après avoir sélectionné un type d'affichage une fonction 'Insérer' vous est proposée. Possibilité d'insérer un créneau qui doit respecter l'emploi du temps actuel.");
    let text5 = document.createTextNode("Clic gauche sur un créneau pour mieux voir les créneaux du même type.");
    let text6 = document.createTextNode("Clic droit sur un créneau pour voir l'horaire de ce dernier ainsi qu'apporter des modifications ou le supprimer. Vous avez la possibilité de voir les commentaires se rapportant à ce créneau ainsi qu'en rajouter ou supprimer.");
    let text7 = document.createTextNode("Vous avez la possibilité de modifier et d'insérer un même créneau sur plusieurs semaines.");
    let text8 = document.createTextNode("Historique de modification(s)/suppression(s)/insertion(s) dans le menu de navigation.");
    let text9 = document.createTextNode("Possibilité d'afficher l'emploi du temps général ou d'un(e) professeur/salle/matière en particulier en allant dans 'Emploi du temps' dans le menu de navigation ou en cliquant directement sur ce dernier dans un créneau apparaissant.");
    let text10 = document.createTextNode("Possibilité de déplacer un créneau grâce la fonction 'Drag And Drop'.");
    let text11 = document.createTextNode("Possibilité d'intervertir deux créneaux grâce à cette même fonction 'Drag And Drop'. Une demande de déplacement apparaît donc dans le menu 'Déplacements' accessible par le menu de navigation. Il faut que la demande soit acceptée par les deux professeurs concernés pour que cette dernière soit appliquée.");
    let text12 = document.createTextNode("Possibilité de sauvegarder le nouvel emploi du temps localement.");
    let text13 = document.createTextNode("Possibilité de se connecter avec une adresse mail et un mot de passe. Ceci est nécessaire afin d'apporter quelconque information.");

    for (let i = 1; i < 14; i++) { // print all rows
        modalBody.appendChild(eval("text" + i));
        modalBody.appendChild(document.createElement("br"));
        modalBody.appendChild(document.createElement("br"));
    }

    let modalFooter = document.createElement("div");
    modalFooter.classList.add("modal-footer");
    let buttonFooter = document.createElement("button"); // close the popup
    buttonFooter.type = "button";
    buttonFooter.classList.add("btn","btn-info");
    buttonFooter.setAttribute("data-dismiss", "modal");
    buttonFooter.innerHTML = "Close";
    modalFooter.appendChild(buttonFooter);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    return modal;
}

function getIdOfJSON(word, key) { // get the id of an element in a json element by his name
    for(let i = 0; i < key.length; i++) {
        if (key[i]["nom"] === word) {
            return key[i]["id"];
        }
    }
}

function getNameOfJSON(id, key) { // get the name of an element in a json element by his id
    for(let i = 0; i < key.length; i++) {
        if (key[i]["id"] === id) {
            return key[i]["nom"];
        }
    }
}

function verifCoherence(toInsert, tab) { // check if we can insert a course into a schedule, check the consistent with the schedule
    let date = toInsert["heure"].split(" ")[0];
    let tabDate = []; // the schedule of the day

    tabDate.push(toInsert); // push the course to insert into the array

    for(let i = 0; i < tab.length; i++) { // push all courses that have the same date than the course to insert
        if (tab[i]["heure"].split(" ")[0] === date) {
            tabDate.push(tab[i]);
        }
    }
    for(let i = 0; i < tabDate.length - 1; i++) { // for each course
        let date1Start = new Date(tabDate[i]["heure"].split(" ")[0]+"T"+tabDate[i]["heure"].split(" ")[1]); // the time at which the course begins
        let date1End = new Date(tabDate[i]["heure"].split(" ")[0]+"T"+tabDate[i]["heure"].split(" ")[1]); // the time at which the course ends
        if (tabDate[i]["duree"] !== undefined) { // set the end times to the course
            date1End.setMinutes(date1End.getMinutes() + tabDate[i]["duree"]);
        } else {
            date1End.setMinutes(date1End.getMinutes() + 90);
        }
        for(let j = i + 1; j < tabDate.length; j++) { // for each course except those already done
            let date2Start = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course begins
            if (tabDate[i]["idgroupe"] == tabDate[j]["idgroupe"]) { // if the groups are exactly the same
                let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                if (tabDate[j]["duree"] !== undefined) {
                    date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                } else {
                    date2End.setMinutes(date2End.getMinutes() + 90);
                }
                /* check that there is no collision of timetables between these two courses */
                if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                    return false;
                }
            }
            let nameI = getNameOfJSON(tabDate[i]["idgroupe"], groupes); // the name of the group of the first course
            let nameJ = getNameOfJSON(tabDate[j]["idgroupe"], groupes); // the name of the group of the second course
            if (((nameI === "INFO 1") && (nameJ.includes("1-"))) || ((nameJ === "INFO 1") && (nameI.includes("1-")))) { // there are both from the same general group INFO 1 or group 1
                let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                if (tabDate[j]["duree"] !== undefined) {
                    date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                } else {
                    date2End.setMinutes(date2End.getMinutes() + 90);
                }
                /* check that there is no collision of timetables between these two courses */
                if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                    return false;
                }
            }
            if (((nameI === "INFO 2") && (nameJ.includes("2-"))) || ((nameJ === "INFO 2") && (nameI.includes("2-")))) { // there are both from the same general group INFO 2 or group 2
                let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                if (tabDate[j]["duree"] !== undefined) {
                    date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                } else {
                    date2End.setMinutes(date2End.getMinutes() + 90);
                }
                /* check that there is no collision of timetables between these two courses */
                if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                    return false;
                }
            }
            for(let k = 1; k < 3; k++) { // for each A, B, C groups
                if (((nameI === "groupe "+k+"-A") && (nameJ === "groupe "+k+"-A-1" || nameJ === "groupe "+k+"-A-2")) || ((nameJ === "groupe "+k+"-A") && (nameI === "groupe "+k+"-A-1" || nameI === "groupe "+k+"-A-2"))) { // there are both from the same general group A
                    let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                    if (tabDate[j]["duree"] !== undefined) {
                        date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                    } else {
                        date2End.setMinutes(date2End.getMinutes() + 90);
                    }
                    /* check that there is no collision of timetables between these two courses */
                    if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                        return false;
                    }
                }
                if (((nameI === "groupe "+k+"-B") && (nameJ === "groupe "+k+"-B-1" || nameJ === "groupe "+k+"-B-2")) || ((nameJ === "groupe "+k+"-B") && (nameI === "groupe "+k+"-B-1" || nameI === "groupe "+k+"-B-2"))) { // there are both from the same general group B
                    let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                    if (tabDate[j]["duree"] !== undefined) {
                        date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                    } else {
                        date2End.setMinutes(date2End.getMinutes() + 90);
                    }
                    /* check that there is no collision of timetables between these two courses */
                    if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                        return false;
                    }
                }
                if (((nameI === "groupe "+k+"-C") && (nameJ === "groupe "+k+"-C-1" || nameJ === "groupe "+k+"-C-2")) || ((nameJ === "groupe "+k+"-C") && (nameI === "groupe "+k+"-C-1" || nameI === "groupe "+k+"-C-2"))) { // there are both from the same general group C
                    let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                    if (tabDate[j]["duree"] !== undefined) {
                        date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                    } else {
                        date2End.setMinutes(date2End.getMinutes() + 90);
                    }
                    /* check that there is no collision of timetables between these two courses */
                    if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                        return false;
                    }
                }
            }
            if (tabDate[i]["idprof"] === tabDate[j]["idprof"]) { // the id of the teachers are the same for the two courses
                let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                if (tabDate[j]["duree"] !== undefined) {
                    date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                } else {
                    date2End.setMinutes(date2End.getMinutes() + 90);
                }
                /* check that there is no collision of timetables between these two courses */
                if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                    return false;
                }
            }
            if (tabDate[i]["idsalle"] === tabDate[j]["idsalle"]) { // the id of the classrooms are the same for the two courses
                let date2End = new Date(tabDate[j]["heure"].split(" ")[0]+"T"+tabDate[j]["heure"].split(" ")[1]); // the time at which the second course ends
                if (tabDate[j]["duree"] !== undefined) {
                    date2End.setMinutes(date2End.getMinutes() + parseInt(tabDate[j]["duree"]));
                } else {
                    date2End.setMinutes(date2End.getMinutes() + 90);
                }
                /* check that there is no collision of timetables between these two courses */
                if (((date2Start <= date1Start) && (date1Start < date2End)) || ((date2Start < date1End) && (date1End < date2End)) || ((date1Start <= date2Start) && (date2Start < date1End)) || ((date1Start < date2End) && (date2End < date1End))) {
                    return false;
                }
            }
        }
    }
    return true; // it's possible to insert this course
}

function insertToTab(toInsert, tab) { // insert an element into an array
    let done = false;
    for (let i = 0; i < tab.length; i++) { // check if it had to be insert into two courses
        if (toInsert["heure"] < tab[i]["heure"]) {
            tab.splice(i, 0, toInsert); // insert into two courses
            done = true;
            break;
        }
    }
    if (!done){ // insert at the end of the schedule
        tab.push(toInsert);
    }
}

function downloadJSON() { // download the json file
    let json = {"edt": edt, "matieres": matieres, "profs":  profs, "groupes": groupes, "salles": salles, "commentaires": commentaires, "deplacements": deplacements}; // construct the file content
    const a = document.body.appendChild(document.createElement('a')); // a clickable element
    const file = new Blob([JSON.stringify(json)], { // construct the all file
        type: 'application/json'
    });
    a.href = URL.createObjectURL(file); // the reference of the file
    a.download = 'js2.json'; // the name file
    a.click(); // execute the save request
}

function printHistory() { // print the history page
    let tbl = document.getElementById("selectedWeek");
    tbl.innerHTML = ""; // reset the page

    /* remove all card that give possibilities to change anything in the database */

    removeCardSelection();
    removeCardInsertion();
    removeCardDeletModifComment();

    let card = document.createElement("div");
    card.classList.add("card", "bg-light", "mb-3", "w-100");
    card.style = "margin-right: 1rem;";

    let div = document.createElement("div");
    div.classList.add("card-body");
    let h3 = document.createElement("h3");
    h3.classList.add("card-title");
    let text1 = document.createTextNode("Liste des modifications apportées :"); // title
    h3.appendChild(text1);
    div.appendChild(h3);
    div.appendChild(document.createElement("br"));

    for (let i = 0; i < history.length; i++) { // for each modification
        let ul = document.createElement("ul");
        let li1 = document.createElement("li");
        let text = null;
        let button = null;

        let action = history[i][0]; // the type of modification
        let tab = history[i][1][0]; // the course
        let date = printDatesOfWeek(tab["heure"].split(" ")[0]); // the complete textual date
        for(let i = 0; i < monthsEN.length; i++) { // set the month to french
            if (monthsEN[i] === date[2]) {
                date[2] = months[i];
                break;
            }
        }
        let hour = tab["heure"].split(" ")[1].split(":");
        let creneauComplet = date[0]+" "+date[1]+" "+date[2]+" "+date[3]+" à "+hour[0]+"H"+hour[1]+" : "+((tab["duree"] != undefined) ? tab["duree"] : 90)+" minutes de "+tab["type"]+" "+getNameOfJSON(tab["idmatiere"], matieres)+" avec "+getNameOfJSON(tab["idprof"], profs)+", "+getNameOfJSON(tab["idgroupe"], groupes)+" en "+getNameOfJSON(tab["idsalle"], salles); // set the modification to a textual information

        if (action.includes("Insertion")) { // if the modification is an insertion
            let dHisto = history[i][2]; // the date of modification
            let dToSet = pad(dHisto.getDate())+"/"+pad(dHisto.getMonth())+"/"+dHisto.getFullYear()+" à "+pad(dHisto.getHours())+"H"+pad(dHisto.getMinutes())+" : "; // date of modification
            text = document.createTextNode(dToSet+"Insertion par " + history[i][3] + " le "+creneauComplet+"."); // the full insertion text
            if (action.includes(" ")) { // if the insertion is for multiple weeks
                text = document.createTextNode(dToSet+"Pour "+action.split(" ")[1]+" semaines. Insertion par " + history[i][3] + " le "+creneauComplet+"."); // add the number of weeks as indication
            }
        } else if (action.includes("Modification")) { // if it's a modification type
            let tab2 = history[i][2][0];
            let date2 = printDatesOfWeek(tab2["heure"].split(" ")[0]); // set the date as a textual full date
            for(let i = 0; i < monthsEN.length; i++) { // transform the english month to a french month
                if (monthsEN[i] === date2[2]) {
                    date2[2] = months[i];
                    break;
                }
            }
            let hour2 = tab2["heure"].split(" ")[1].split(":");
            let dHisto = history[i][3];
            let dToSet = pad(dHisto.getDate())+"/"+pad(dHisto.getMonth())+"/"+dHisto.getFullYear()+" à "+dHisto.getHours()+"H"+dHisto.getMinutes()+" : "; // date of modification
            text = document.createTextNode(dToSet+"Modification par " + history[i][4] + " du "+creneauComplet+" - en - "+date2[0]+" "+date2[1]+" "+date2[2]+" "+date2[3]+" à "+hour2[0]+"H"+hour2[1]+" : "+((tab2["duree"] != undefined) ? tab2["duree"] : 90)+" minutes de "+tab2["type"]+" "+getNameOfJSON(tab2["idmatiere"], matieres)+" avec "+getNameOfJSON(tab2["idprof"], profs)+", "+getNameOfJSON(tab2["idgroupe"], groupes)+" en "+getNameOfJSON(tab2["idsalle"], salles)+"."); // the full modification text
            if (action.includes(" ")) { // if the modification is for multiple weeks
                text = document.createTextNode(dToSet+"Pour "+action.split(" ")[1]+" semaines. Modification par " + history[i][4] + " du "+creneauComplet+" - en - "+date2[0]+" "+date2[1]+" "+date2[2]+" "+date2[3]+" à "+hour2[0]+"H"+hour2[1]+" : "+((tab2["duree"] != undefined) ? tab2["duree"] : 90)+" minutes de "+tab2["type"]+" "+getNameOfJSON(tab2["idmatiere"], matieres)+" avec "+getNameOfJSON(tab2["idprof"], profs)+", "+getNameOfJSON(tab2["idgroupe"], groupes)+" en "+getNameOfJSON(tab2["idsalle"], salles)+"."); // add the number of weeks as indication
            }
        } else if (action === "Suppression") { // if it's a deletion
            let dHisto = history[i][2];
            let dToSet = pad(dHisto.getDate())+"/"+pad(dHisto.getMonth())+"/"+dHisto.getFullYear()+" à "+dHisto.getHours()+"H"+dHisto.getMinutes()+" : "; // date of modification
            text = document.createTextNode(dToSet+"Suppression par " + history[i][3] + " le "+creneauComplet+"."); // the full deletion text
            button = document.createElement("button"); // button to get back and reinsert the deleted schedule
            button.type = "button";
            button.classList.add("btn", "btn-info", "btn-histo");
            button.innerHTML = "Récupérer";
            button.setAttribute("onclick", "reinsert("+i+")");
        } else if (action === "Inversion") { // if it's a swap
            let tab2 = history[i][2][0];
            let date2 = printDatesOfWeek(tab2["heure"].split(" ")[0]); // the full textual date
            for(let i = 0; i < monthsEN.length; i++) { // english month to french month
                if (monthsEN[i] === date2[2]) {
                    date2[2] = months[i];
                    break;
                }
            }
            let hour2 = tab2["heure"].split(" ")[1].split(":");
            let dHisto = history[i][5]; // the date
            let dToSet = pad(dHisto.getDate())+"/"+pad(dHisto.getMonth())+"/"+dHisto.getFullYear()+" à "+dHisto.getHours()+"H"+dHisto.getMinutes()+" : "; // get tge date of the swap
            text = document.createTextNode(dToSet+"Inversion d'horaires demandée par " + history[i][6] + " entre "+creneauComplet+" - et - "+date2[0]+" "+date2[1]+" "+date2[2]+" "+date2[3]+" à "+hour2[0]+"H"+hour2[1]+" : "+((tab2["duree"] != undefined) ? tab2["duree"] : 90)+" minutes de "+tab2["type"]+" "+getNameOfJSON(tab2["idmatiere"], matieres)+" avec "+getNameOfJSON(tab2["idprof"], profs)+", "+getNameOfJSON(tab2["idgroupe"], groupes)+" en "+getNameOfJSON(tab2["idsalle"], salles)+"."); // the full swap text
        }
        li1.appendChild(text);
        if (button !== null) { // if there is the reinsert button we add it
            li1.appendChild(button);
        }
        ul.appendChild(li1);
        div.appendChild(ul);
    }
    if (history.length == 0) { // if the history is empty
        let text = document.createTextNode("Aucune modification apportée.");
        div.appendChild(text);
    }
    card.appendChild(div);
    tbl.appendChild(card);
}

function reinsert(index) { // reinsert a course
    if (!connected) { // the user must be connected
        alert("Merci de vous connecter !");
        return;
    }
    if (verifCoherence(history[index][1][0], edt)) { // verif if we can put this schedule back into the edt
        insertToTab(history[index][1][0], edt); // insert into the database
        history.splice(index,1); // push it into the history
        printHistory(); // reprint the history
    } else { // alert that it can't be reinsert
        alert("Impossible de récupérer ce créneau.");
    }
}

function ctrlAndZ() { // action when the user is doing a ctrl+z
    if (!connected) { // the user must be connected
        return;
    }
    if ((history.length != 0) && (document.querySelector(".popup").style.display === "none") && (document.querySelector(".commentSchedule").style.display === "none")) { // the history is not empty and all the popup are hidden
        let type = history[history.length-1][0]; // type of modification
        let tabOne = history[history.length-1][1]; // the course
        if(type.includes("Insertion")) { // the modification is an insertion
            if (type.includes(" ")) { // it was applied for mutliple weeks
                let nb = type.split(" ")[1]; // number of weeks
                let y = tabOne[0]["heure"].split(" ")[0].substring(0,4);
                let m = monthsEN[tabOne[0]["heure"].split(" ")[0].substring(5,7) - 1];
                let d = tabOne[0]["heure"].split(" ")[0].substring(8,10);
                for(let i = 0; i < nb; i++) { // for each date
                    let tmp = tabOne[0];
                    let date = new Date(m + " " + d + ", " + y);
                    date.setDate(date.getDate() + (i*7));
                    tmp["heure"] = date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+" "+tabOne[0]["heure"].split(" ")[1]; // set the exact schedule
                    deleteFromATab(edt, tmp); // delete the course from the edt database
                    removeCommentOnScheduleAll(commentaires, [tmp].slice()); // delete all comments that coincide with this date
                    checkDemandeDeplacement(deplacements, [tmp].slice()); // the same for all swap request
                }
            } else {
                deleteFromATab(edt, tabOne[0]); // delete the course pushed
                removeCommentOnScheduleAll(commentaires, [tabOne[0]].slice()); // delete all comments that coincide with this date
                checkDemandeDeplacement(deplacements, [scheduleToChange].slice()); // the same for all swap request
            }
        } else if (type === "Suppression") { // the previous modification is a deletion
            insertToTab(tabOne[0], edt); // reinsert this one
        } else if (type.includes("Modification")) { // if it's a modification type
            let tabTwo = history[history.length-1][2]; // the course pushed
            if (type.includes(" ")) { // it was applied for mutliple weeks
                let nb = type.split(" ")[1]; // number of weeks

                let y1 = tabOne[0]["heure"].split(" ")[0].substring(0,4);
                let m1 = monthsEN[tabOne[0]["heure"].split(" ")[0].substring(5,7) - 1];
                let d1 = tabOne[0]["heure"].split(" ")[0].substring(8,10);

                let y2 = tabTwo[0]["heure"].split(" ")[0].substring(0,4);
                let m2 = monthsEN[tabTwo[0]["heure"].split(" ")[0].substring(5,7) - 1];
                let d2 = tabTwo[0]["heure"].split(" ")[0].substring(8,10);
                for(let i = 0; i < nb; i++) { // for each weeks
                    let tmp1 = [tabOne[0]];;
                    let tmp2 = [tabTwo[0]];;

                    let date1 = new Date(m1 + " " + d1 + ", " + y1);
                    date1.setDate(date1.getDate() + (i*7));
                    let date2 = new Date(m2 + " " + d2 + ", " + y2);
                    date2.setDate(date2.getDate() + (i*7));

                    tmp1[0]["heure"] = date1.getFullYear()+"-"+pad(date1.getMonth()+1)+"-"+pad(date1.getDate())+" "+tabOne[0]["heure"].split(" ")[1]; // the course deleted
                    tmp2[0]["heure"] = date2.getFullYear()+"-"+pad(date2.getMonth()+1)+"-"+pad(date2.getDate())+" "+tabTwo[0]["heure"].split(" ")[1]; // the course added
                    deleteFromATab(edt, JSON.parse(JSON.stringify(tmp2[0]))); // remove the course pushed
                    removeCommentOnScheduleAll(commentaires, [tmp2[0]].slice()); // remove all comments assigned
                    checkDemandeDeplacement(deplacements, [tmp2[0]].slice()); // the same with swap requests
                    insertToTab(JSON.parse(JSON.stringify(tmp1[0])), edt); // insert the course deleted
                }
            } else {
                deleteFromATab(edt, tabTwo[0]); // remove the course pushed
                removeCommentOnScheduleAll(commentaires, [tabTwo[0]].slice()); // remove all comments assigned
                checkDemandeDeplacement(deplacements, [scheduleToChange].slice()); // the same with swap requests
                insertToTab(tabOne[0], edt); // insert the course deleted
            }
        } else if (type === "Inversion") { // if it's a swap
            let tabTwo = history[history.length-1][2]; // the second added
            let tabOneBase = history[history.length-1][3]; // the first deleted
            let tabTwoBase = history[history.length-1][4]; // the second deleted
            deleteFromATab(edt, tabOne[0]); // remove both from the edt database
            deleteFromATab(edt, tabTwo[0]);
            removeCommentOnScheduleAll(commentaires, [tabOne[0]].slice()); // remove all comments that coincide
            removeCommentOnScheduleAll(commentaires, [tabTwo[0]].slice());
            checkDemandeDeplacement(deplacements, [tabOne[0]].slice()); // remove all swap requests that coincide
            checkDemandeDeplacement(deplacements, [tabTwo[0]].slice());
            insertToTab(tabOneBase[0], edt); // insert both to the edt database
            insertToTab(tabTwoBase[0], edt);
        }
        removeCardDeletModifComment(); // remove the possibilities to delete, modify, put/remove comments
        printAfterModif(); // print after this modification
        history.pop(); // remove the last element from the history
    }
}

function setDispo(word) { // print a specific edt
    if ((word == "Professeurs") || (word == "Salles") || (word == "Matières")) { // the option chosen
        let edtTargetPopup = document.querySelector(".edtTargetPopup");
        edtTargetPopup.innerHTML = ""; // reset the popup

        removeCardDeletModifComment(); // remove possibility to modify, delete and add/remove comments

        document.getElementById("main").style.opacity = "0.2"; // can't use the background and the navbar
        document.getElementById("headerNav").style.pointerEvents = "none";
        document.getElementById("main").style.pointerEvents = "none";
        document.body.style.overflow = "hidden";

        edtTargetPopup.classList.add("card", "shadow");
        edtTargetPopup.style.display = "flex";
        document.getElementById("main").style.opacity = "0.2";

        let div = document.createElement("div");
        div.classList.add("card-body");

        let form = document.createElement("form");

        let h2 = document.createElement("h2");
        h2.classList.add("font-weight-bold");
        h2.innerHTML = "Emploi du temps spécifique"; // title
        form.appendChild(h2);

        let row = document.createElement("div");
        row.classList.add("row");
        let col = document.createElement("div");
        col.classList.add("col");

        let label = document.createElement("label");
        let textLabel = document.createTextNode(word); // second title

        let select = document.createElement("select");
        select.classList.add("custom-select", "mr-sm-2");
        select.id = "inlineFormCustomSelect";
    
        if (word == "Professeurs") { // if we want to see the schedule of a specific teacher
            for (let i = 0; i < profs.length; i++) { // create the different option to select
                let option = document.createElement("option");
                option.value = profs[i]["nom"];
                let textOption = document.createTextNode(profs[i]["nom"]);
                option.appendChild(textOption);
                select.appendChild(option);
            }
            inWhichEdtTarget = ["profs"]; // construct a part of this variable
        } else if (word == "Salles") { // if we want to see the schedule of a specific classroom
            for (let i = 0; i < salles.length; i++) { // create the different option to select
                let option = document.createElement("option");
                option.value = salles[i]["nom"];
                let textOption = document.createTextNode(salles[i]["nom"]);
                option.appendChild(textOption);
                select.appendChild(option);
            }
            inWhichEdtTarget = ["salles"]; // construct a part of this variable
        } else if (word == "Matières") { // if we want to see the schedule of a specific school subject
            for (let i = 0; i < matieres.length; i++) { // create the different option to select
                let option = document.createElement("option");
                option.value = matieres[i]["nom"];
                let textOption = document.createTextNode(matieres[i]["nom"]);
                option.appendChild(textOption);
                select.appendChild(option);
            }
            inWhichEdtTarget = ["matieres"]; // construct a part of this variable
        }
        
        label.appendChild(textLabel);
        col.appendChild(label);
        col.appendChild(select);
        row.appendChild(col);
        form.appendChild(row);

        let buttonV = document.createElement("button"); // button to validate the choice
        buttonV.type = "button";
        buttonV.classList.add("btn", "btn-success", "btn-popup");
        let textV = document.createTextNode("Valider");
        buttonV.appendChild(textV);
        buttonV.setAttribute("onclick", "validateEdtTarget()");

        let buttonA = document.createElement("button"); // button to close the popup and to cancel the action
        buttonA.type = "button";
        buttonA.classList.add("btn", "btn-danger", "btn-popup");
        let textA = document.createTextNode("Annuler");
        buttonA.appendChild(textA);
        buttonA.setAttribute("onclick", "removeEdtTarget()");

        form.appendChild(buttonV);
        form.appendChild(buttonA);
        div.appendChild(form);
        edtTargetPopup.appendChild(div);
    } else { // print the general edt database
        inWhichEdtTarget = null; // reset the variable
        if (typeOfSelection === null) {
            printRules(); // print main menu
        } else {
            printAfterModif(); // reprint this page after modification
        }
    }
}

function validateEdtTarget() {
    removeEdtTarget();
    let valeur = document.getElementById("inlineFormCustomSelect").value;

    inWhichEdtTarget.push(valeur);
    if (typeOfSelection === null) { // if we have to print the main menu
        printRules();
    } else { // else reprint the actual page by printing after modification
        printAfterModif();
    }
}

function selectSpecial(key, valeur) { // click on an key element from the edt
    inWhichEdtTarget = [key, valeur]; // set the variable = the key (teacher, classroom, school subject) and the value of the key
    removeCardDeletModifComment(); // remove possibility to add/remove comments, delete and modifiate
    printAfterModif(); // reprint after modification
}

function removeEdtTarget() { // remove the popup for chose a specific part of the edt
    document.querySelector(".edtTargetPopup").style.display = "none"; // we can click on the background/the navbar and use this one
    document.getElementById("main").style.opacity = null;

    document.getElementById("headerNav").style.pointerEvents = null;
    document.getElementById("main").style.pointerEvents = null;
    document.body.style.overflow = null;
}

function redirectAccueil() { // print the main menu
    /* remove all card that give possibilities to modify, delete and add/remove comments */

    removeCardSelection();
    removeCardInsertion();
    removeCardDeletModifComment();
    printRules(); // set the main menu
}


function drag(ev) { // drag an element ev -> set into the variable dragElement
    dragElement = ev.target.id;
}

function allowDrop(ev) { // allow drop on an element ev
    ev.preventDefault();
}

function drop(ev) { // drop on an element ev
    if (!connected) { // check if the user is connected
        alert("Merci de vous connecter !");
        return;
    }
    ev.preventDefault();
    dropElement = ev.target.id; // drag on an element ev -> set into the variable dropElement
    intervertirBoth(); // try to swap both courses
}

function intervertirBoth(validation = false, deplaceIndice = null) {
    if (!connected) { // check if the user is connected
        alert("Merci de vous connecter !");
        return;
    }
    let first = dragElement.split("/"); // element drag
    let second = dropElement.split("/"); // element drop
    if (second.length < 2) { // alert user that he must be more accurate
        alert("Soyez précis dans le glisser/déposer !");
        return;
    }
    if ((first[0] == second[0]) && (first[1] == second[1])) { // drag and drop on the same element
        return;
    }

    /* create a temporary database to see if we can apply all changes */

    let tempEdt = JSON.parse(JSON.stringify(edt));
    let commentairesTemp = JSON.parse(JSON.stringify(commentaires));
    let deplacementsTemp = JSON.parse(JSON.stringify(deplacements));
    let firstBase = JSON.parse(JSON.stringify([searchInEdt(first[0], first[1], first[2])]))[0]; // element drag in the database edt
    first = JSON.parse(JSON.stringify([searchInEdt(first[0], first[1], first[2])]))[0];
    let secondBase = JSON.parse(JSON.stringify([searchInEdt(second[0], second[1], second[2])]))[0]; // element drop in the database edt
    second = JSON.parse(JSON.stringify([searchInEdt(second[0], second[1], second[2])]))[0];
    
    let borderSup = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // the maximum time a course can end
    borderSup.setHours(17);
    borderSup.setMinutes(30);
    let borderInf = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // the minimum time a course can start
    borderInf.setHours(8);
    borderInf.setMinutes(15);

    deleteFromATab(tempEdt, firstBase); // remove from the temporary edt database the element drag
    removeCommentOnScheduleAll(commentairesTemp, [firstBase].slice()); // the same with comments assigned to the element drag
    checkDemandeDeplacement(deplacementsTemp, [firstBase].slice()); // the same with swap requests assigned to the element drag
    if (secondBase !== null) { // if there is a second element -> the drop field is not empty
        deleteFromATab(tempEdt, secondBase); // remove from the temporary edt database the element drop
        removeCommentOnScheduleAll(commentairesTemp, [secondBase].slice()); // the same with comments assigned to the element drop
        checkDemandeDeplacement(deplacementsTemp, [secondBase].slice()); // the same with swap requests assigned to the element drop
    }
    for (let i = 1; i < 3; i++) { // to simplify the code for INFO 1 and INFO 2
        if (second === null) { // the cell where we drop the element is not empty
            first["heure"] = dropElement.split("/")[0]+" "+dropElement.split("/")[1]; // set the course start time and end time as the second schedule
            if ((getNameOfJSON(first["idgroupe"], groupes).includes(dropElement.split("/")[2].split("_")[1])) || ((getNameOfJSON(first["idgroupe"], groupes) === "LP DIOC") && (dropElement.split("/")[2].split("_")[1] === "LP DIOC-")) || ((getNameOfJSON(first["idgroupe"], groupes) === "INFO 1") && (dropElement.split("/")[2].split("_")[1] === "1-")) || ((getNameOfJSON(first["idgroupe"], groupes) === "INFO 2") && (dropElement.split("/")[2].split("_")[1] === "2-"))) { // the general info group from that two schedule coincide
                let realDate = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // date if the element dragged
                let untilDate = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // the possible end time of the element dragged
                let duree = 90;
                if (first["duree"] !== undefined) { // set minutes to the possible end time of the element dragged
                    untilDate.setMinutes(parseInt(realDate.getMinutes()) + parseInt(first["duree"]));
                    duree = first["duree"];
                } else {
                    untilDate.setMinutes(parseInt(realDate.getMinutes()) + duree);
                }
                if (realDate < borderInf) { // set the schedule to the possible start time if the actual schedule is under
                    first["heure"] = first["heure"].split(" ")[0]+" 08:15:00";
                }
                if (untilDate > borderSup) { // set the schedule to the possible end time if the actual schedule is upper
                    realDate.setHours(17);
                    realDate.setMinutes(30 - duree);
                    first["heure"] = first["heure"].split(" ")[0] +" "+pad(realDate.getHours())+":"+pad(realDate.getMinutes())+":"+pad(realDate.getSeconds());
                }
                if (verifCoherence(first, tempEdt)) { // check if it's possible to insert the course at the selected schedule
                    insertToTab(first, tempEdt); // insert the course into the temporary edt database
                    edt = JSON.parse(JSON.stringify(tempEdt)); // apply to the real edt
                    commentaires = JSON.parse(JSON.stringify(commentairesTemp)); // the same for the comment database
                    deplacements = JSON.parse(JSON.stringify(deplacementsTemp)); // the same for the swap requests database
                    history.push(["Modification", [firstBase].slice(), [first].slice(), new Date(), userConnected]); // add this to the history
                    removeCardDeletModifComment(); // remove possibility to modify, delete and add/remove comments
                    printAfterModif(); // reprint after modification
                    return;
                } else { // alert that it's impossible to mvoe this course here
                    alert("Impossible de déplacer ce créneau ici.");
                    return;
                }
            } else { // alert that it's impossible to move this course at a different promo
                alert("Impossible d'intervertir les créneaux de deux années différentes.");
                return;
            }
        } else if ((getNameOfJSON(first["idgroupe"], groupes) === ("INFO "+i).toString()) || (getNameOfJSON(first["idgroupe"], groupes).includes((i+"-").toString()))) { // the general info group from that two schedule coincide
            if ((getNameOfJSON(second["idgroupe"], groupes) === ("INFO "+i).toString()) || (getNameOfJSON(second["idgroupe"], groupes).includes((i+"-").toString()))) {
                
                /* swap both schedule */
                
                first["heure"] = dropElement.split("/")[0]+" "+dropElement.split("/")[1];
                second["heure"] = dragElement.split("/")[0]+" "+dragElement.split("/")[1];
                let realDate = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // date of the element dragged
                let untilDate = new Date(first["heure"].split(" ")[0]+"T"+first["heure"].split(" ")[1]); // the possible end time of the element dragged
                let duree = 90;
                if (first["duree"] !== undefined) { // set minutes to the possible end time of the element dragged
                    untilDate.setMinutes(parseInt(realDate.getMinutes()) + parseInt(first["duree"]));
                    duree = first["duree"];
                } else {
                    untilDate.setMinutes(parseInt(realDate.getMinutes()) + duree);
                }
                if (realDate < borderInf) { // set the first schedule to the possible start time if the actual first schedule is under
                    first["heure"] = first["heure"].split(" ")[0]+" 08:15:00";
                }
                if (untilDate > borderSup) { // set the first schedule to the possible end time if the actual first schedule is upper
                    realDate.setHours(17);
                    realDate.setMinutes(30 - duree);
                    first["heure"] = first["heure"].split(" ")[0] +" "+pad(realDate.getHours())+":"+pad(realDate.getMinutes())+":"+pad(realDate.getSeconds());
                }
                if (verifCoherence(first, tempEdt)) { // check if it's possible to insert the first course at the selected schedule
                    insertToTab(first, tempEdt); // insert the first course to the temporary edt database
                    let realDate2 = new Date(second["heure"][0]+"T"+second["heure"][1]); // date of the element where we drop
                    let untilDate2 = new Date(second["heure"][0]+"T"+second["heure"][1]); // the possible end time of the element where we drop
                    if (second["duree"] !== undefined) { // set minutes to the possible end time of the element where we drop
                        untilDate2.setMinutes(parseInt(realDate2.getMinutes()) + parseInt(second["duree"]));
                    } else {
                        untilDate2.setMinutes(parseInt(realDate2.getMinutes()) + 90);
                    }
                    if (realDate2 < borderInf) { // set the second schedule to the possible start time if the actual second schedule is under
                        second["heure"] = second["heure"].split(" ")[0]+" 08:15:00";
                    }
                    if (untilDate2 > borderSup) { // set the second schedule to the possible end time if the actual second schedule is upper
                        realDate2.setHours(17);
                        realDate2.setMinutes(30 - duree);
                        second["heure"] = second["heure"].split(" ")[0] +" "+realDate2.getHours()+":"+realDate2.getMinutes()+":"+realDate2.getSeconds();
                    }
                    if (verifCoherence(second, tempEdt)) { // check if it's possible to insert the first course at the selected schedule
                        if (validation) { // the two teachers have accepted this request
                            insertToTab(second, tempEdt); // insert the second course to the temporary edt database
                            edt = JSON.parse(JSON.stringify(tempEdt)); // apply to the real edt
                            commentaires = JSON.parse(JSON.stringify(commentairesTemp)); // the same for the comment database
                            deplacements = JSON.parse(JSON.stringify(deplacementsTemp)); // the same for the swap requests database
                            history.push(["Inversion", [first].slice(), [second].slice(), [firstBase].slice(), [secondBase].slice(), new Date(), userConnected]); // add this modification to the history
                            deplacements.splice(deplaceIndice, 1); // remove the swap request assigned to these courses
                            removeCardDeletModifComment(); // remove possibility to modify, delete and remove/add comments
                            printAfterModif(); // reprint after applied modification
                        } else { // the two teachers haven't accepted this request
                            let alreadyIn = false;
                            for (let i = 0; i < deplacements.length; i++) { // the swap request is already in the database
                                if (((deplacements[i]["elementDrag"] == dragElement) && (deplacements[i]["elementDrop"] == dropElement)) && (alreadyIn == false)) {
                                    alreadyIn = true;
                                }
                            }
                            if (alreadyIn == false) { // push this swap request into the database
                                deplacements.push({"elementDrag": dragElement, "elementDrop": dropElement, "actor": userConnected, "accord": [1,1]});
                            }
                        }
                        return;
                    } else { // the second course can't be insert into the edt database
                        alert("Impossible d'intervertir ces deux créneaux.");
                        return;
                    }
                } else { // the first course can't be insert into the edt database
                    alert("Impossible d'intervertir ces deux créneaux.");
                    return;
                }
            } else { // alert that it's impossible to move this course at a different promo
                alert("Impossible d'intervertir les créneaux de deux années différentes.");
                return;
            }
        }
    }
}

function searchInEdt(date, heure, idgroupe) { // search an element in the edt database by the date, idgroupe and the course start time
    for (let i = 0; i < edt.length; i++) {
        if (idgroupe !== undefined) {
            if ((edt[i]["idgroupe"] == idgroupe) && (edt[i]["heure"].split(" ")[0] == date) && (edt[i]["heure"].split(" ")[1] == heure)) { // if both coincide
                return edt[i];
            }
        }
    }
    return null; // course not find
}

function commentOnSchedule() { // print comments assigned to a schedule
    let commentSchedule = document.querySelector(".commentSchedule");
    commentSchedule.innerHTML = ""; // reset the comment page

    /* can't use the background page */

    document.getElementById("main").style.opacity = "0.2";
    document.getElementById("headerNav").style.pointerEvents = "none";
    document.getElementById("main").style.pointerEvents = "none";
    document.body.style.overflow = "hidden";

    commentSchedule.classList.add("card", "shadow");
    commentSchedule.style.display = "flex";

    let div = document.createElement("div");
    div.classList.add("card-body");

    let h2 = document.createElement("h2");
    h2.classList.add("card-title");
    let day = printDatesOfWeek(scheduleToChange["heure"].split(" ")[0]);
    day[2] = enMonthToFr(day[2]);
    h2.innerHTML = "Commentaires du " + day[0] + " " + day[1] + " " + day[2] + " " + day[3] + " " + scheduleToChange["heure"].split(" ")[1].split(":")[0] + "H" + scheduleToChange["heure"].split(" ")[1].split(":")[1] + ", groupe " + getNameOfJSON(scheduleToChange["idgroupe"], groupes); // set the title with the schedule informations
    div.appendChild(h2);

    let find = false;

    for (let i = 0; i < commentaires.length; i++) { // for each comment
        if ((commentaires[i]["heure"] == scheduleToChange["heure"]) && (commentaires[i]["idgroupe"] == scheduleToChange["idgroupe"])) { // if the comment schedule correspond with the date
            let h5 = document.createElement("h5");
            h5.classList.add("card-text");
            let datePut = commentaires[i]["date"].split(" ");
            let datePut0 = printDatesOfWeek(datePut[0]); // the full textual date
            datePut0[2] = enMonthToFr(datePut0[2]);
            h5.innerHTML = commentaires[i]["text"]+ " | " + commentaires[i]["signature"] + " (" + datePut0[0] + " " + datePut0[1] + " " + datePut0[2] + " " + datePut0[3] + " à " + datePut[1].split(":")[0] + "H" + datePut[1].split(":")[1] +")."; // set a text line comment
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("btn", "btn-danger", "btn-deleteComment");
            button.innerHTML = "X";
            button.setAttribute("onclick", "removeCommentOnScheduleButton("+i+")"); // remove this actual comment
            h5.appendChild(button);
            div.appendChild(h5);
            find = true;
        }
    }

    if (!find) { // no comments for this schedule course
        let h5 = document.createElement("h5");
        h5.classList.add("card-text");
        h5.innerHTML = "Il n'y a aucun commentaire pour ce créneau.";
        div.appendChild(h5);
    }

    let buttonV = document.createElement("button"); // add a comment for this schedule
    buttonV.type = "button";
    buttonV.classList.add("btn", "btn-success", "btn-popup");
    let textV = document.createTextNode("Ajouter");
    buttonV.appendChild(textV);
    buttonV.setAttribute("onclick", "addCommentOnSchedule()");

    let buttonA = document.createElement("button"); // remove this card
    buttonA.type = "button";
    buttonA.classList.add("btn", "btn-danger", "btn-popup");
    let textA = document.createTextNode("Quitter");
    buttonA.appendChild(textA);
    buttonA.setAttribute("onclick", "removeCardComment()");

    div.appendChild(buttonV);
    div.appendChild(buttonA);
    commentSchedule.appendChild(div);
}

function removeCardComment() { // remove the card comment
    document.querySelector(".commentSchedule").style.display = "none"; // remove card comment
    document.getElementById("main").style.opacity = null;

    document.getElementById("headerNav").style.pointerEvents = null; // we can use the full page
    document.getElementById("main").style.pointerEvents = null;
    document.body.style.overflow = null;
    removeCardDeletModifComment(); // remove possibility to modify, delete, put comments
}

function addCommentOnSchedule() { // add a comment on a course
    if (!connected) { // check if the use is connected
        alert("Merci de vous connecter !");
        return;
    }
    let commentSchedule = document.querySelector(".commentSchedule");
    commentSchedule.innerHTML = ""; // reset the comment card

    document.getElementById("main").style.opacity = "0.2"; // can't use the background page
    document.getElementById("headerNav").style.pointerEvents = "none";
    document.getElementById("main").style.pointerEvents = "none";
    document.body.style.overflow = "hidden";

    commentSchedule.classList.add("card", "shadow");
    commentSchedule.style.display = "flex";

    let div = document.createElement("div");
    div.classList.add("card-body");

    let h2 = document.createElement("h2");
    h2.classList.add("card-title");
    let day = printDatesOfWeek(scheduleToChange["heure"].split(" ")[0]);
    day[2] = enMonthToFr(day[2]);
    h2.innerHTML = "Ajout commentaire au " + day[0] + " " + day[1] + " " + day[2] + " " + day[3] + " " + scheduleToChange["heure"].split(" ")[1].split(":")[0] + "H" + scheduleToChange["heure"].split(" ")[1].split(":")[1] + ", groupe " + getNameOfJSON(scheduleToChange["idgroupe"], groupes); // set title with the schedule informations
    div.appendChild(h2);

    let form = document.createElement("div"); // set the text area to put the comment
    form.classList.add("form-comments", "divTextComment");
    let formGroup = document.createElement("form-group");
    let textarea  = document.createElement("textarea");
    textarea.classList.add("form-control");
    textarea.id = "formControlTextareaOnComment";
    textarea.setAttribute("rows", "3");

    formGroup.appendChild(textarea);
    form.appendChild(formGroup);

    let buttonV = document.createElement("button"); // button to validate to put the comment
    buttonV.type = "submit";
    buttonV.classList.add("btn", "btn-success", "btn-popup");
    let textV = document.createTextNode("Valider");
    buttonV.appendChild(textV);
    buttonV.setAttribute("onclick", "validateComment()");

    let buttonA = document.createElement("button"); // button to cancel the operation
    buttonA.type = "submit";
    buttonA.classList.add("btn", "btn-danger", "btn-popup");
    let textA = document.createTextNode("Annuler");
    buttonA.appendChild(textA);
    buttonA.setAttribute("onclick", "commentOnSchedule()");

    form.appendChild(buttonV);
    form.appendChild(buttonA);
    div.appendChild(form);
    commentSchedule.appendChild(div);
}

function validateComment() { // validate the operation of adding a comment
    let text = document.getElementById("formControlTextareaOnComment").value; // the comment
    let sign = userConnected; // the user that put the comment
    if ((text !== "") && (sign !== "")) { // if both are filled
        let date = new Date(); // today's date
        date = date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+" "+pad(date.getHours())+":"+pad(date.getMinutes())+":"+pad(date.getSeconds()); // set corretly the date
        commentaires.push({"heure": scheduleToChange["heure"], "idgroupe": scheduleToChange["idgroupe"], "idprof": scheduleToChange["idprof"], "text": text,"signature": sign,"date": date}); // push the comment informations into the database
        commentOnSchedule(); // return to the comment page
    } else { // alert that all fields are not filled
        alert("Merci de remplir le champ !");
        return;
    }
}

function removeCommentOnScheduleButton(indice) { // remove a comment by clicking on the red cross
    if (!connected) { // check if the user is connected
        alert("Merci de vous connecter !");
        return;
    }
    removeCommentOnScheduleId(indice); // remove the comment
    removeCardComment(); // remove the card comment
    commentOnSchedule(); // return to the comment page
}

function removeDeplaceOnSchedule(indice) { // deny a swap request from the swap request page
    if (!connected) { // check if the user is connected
        alert("Merci de vous connecter !");
        return;
    }
    let crenDrag = searchInEdt(deplacements[indice]["elementDrag"].split("/")[0], deplacements[indice]["elementDrag"].split("/")[1], deplacements[indice]["elementDrag"].split("/")[2]); // get the first course that was dragged
    let crenDrop = searchInEdt(deplacements[indice]["elementDrop"].split("/")[0], deplacements[indice]["elementDrop"].split("/")[1], deplacements[indice]["elementDrop"].split("/")[2]); // get the second course that was dropped
    if ((userConnected == getNameOfJSON(crenDrop["idprof"], profs)) || (userConnected == getNameOfJSON(crenDrag["idprof"], profs))) { // check if he's the right user
        deplacements.splice(indice, 1); // remove the swap request from the database
        printDemandesDeplacements(); // print the swap request page
    } else { // alert that the user is not concerned
        alert("Cette demande ne vous concerne pas !");
        return;
    }
}

function removeCommentOnScheduleId(indice) { // remove a comment from the commentary database by the id
    commentaires.splice(indice, 1);
}

function removeCommentOnScheduleAll(obj, sdl) { // remove all comments that correspond to this course
    for (let i = 0; i < obj.length; i++) {
        if ((obj["heure"] == sdl["heure"]) && (obj["idgroupe"] == sdl["idgroupe"]) && (obj["idprof"] == sdl["idprof"])) { // the comments correspond to the schedule course
            obj.splice(i, 1); // remove the comment from the tab
        }
    }
}

function searchNbCom(schedule) { // get the amount of comments for a selected course
    let count = 0;
    for (let i = 0; i < commentaires.length; i++) { // for each comments in the database
        if ((commentaires[i]["idgroupe"] == schedule["idgroupe"]) && (commentaires[i]["idprof"] == schedule["idprof"]) && (commentaires[i]["heure"].split(" ")[0] == schedule["heure"].split(" ")[0]) && (commentaires[i]["heure"].split(" ")[1] == schedule["heure"].split(" ")[1])) { // if the schedule coincide
            count++;
        }
    }
    return count; // return the amount
}

function enMonthToFr(day) { // return the french traduction of an english month
    for(let i = 0; i < monthsEN.length; i++) {
        if (monthsEN[i] === day) {
            return months[i];
        }
    }
}

function printDemandesDeplacements() { // print all the swap requests
    let tbl = document.getElementById("selectedWeek");
    tbl.innerHTML = ""; // reset the page

    /* remove all the card that give possibilities to add modification at the database */

    removeCardSelection();
    removeCardInsertion();
    removeCardDeletModifComment();

    let card = document.createElement("div");
    card.classList.add("card", "bg-light", "mb-3", "w-100");
    card.style = "margin-right: 1rem;";

    let div = document.createElement("div");
    div.classList.add("card-body");
    let h3 = document.createElement("h3");
    h3.classList.add("card-title");
    let text1 = document.createTextNode("Liste des demandes de déplacements :"); // title
    h3.appendChild(text1);
    div.appendChild(h3);
    div.appendChild(document.createElement("br"));

    if (deplacements.length == 0) { // there is absolutely no swap request
        let text = document.createTextNode("Aucune demande de déplacement.");
        div.appendChild(text);
    } else {
        let tab = {}; // the tab of swap requests
        let ul = document.createElement("ul");
        for (let i = 0; i < deplacements.length; i++) { // for each swap request in the database
            let cren = searchInEdt(deplacements[i]["elementDrop"].split("/")[0], deplacements[i]["elementDrop"].split("/")[1], deplacements[i]["elementDrop"].split("/")[2]); // first course to swap
            let cren2 = searchInEdt(deplacements[i]["elementDrag"].split("/")[0], deplacements[i]["elementDrag"].split("/")[1], deplacements[i]["elementDrag"].split("/")[2]); // second course to swap
            
            /* classify swap requests according to teachers */

            if (tab[cren["idprof"]] !== undefined) {
                tab[cren["idprof"]].push([deplacements[i], i]);
            } else {
                tab[cren["idprof"]] = [];
                tab[cren["idprof"]].push([deplacements[i], i]);
            }
            if (tab[cren2["idprof"]] !== undefined) {
                tab[cren2["idprof"]].push([deplacements[i], i]);
            } else {
                tab[cren2["idprof"]] = [];
                tab[cren2["idprof"]].push([deplacements[i], i]);
            }
        }
        for (var key in tab) { // for each teachers
            let li = document.createElement("li");
            let text = document.createTextNode(getNameOfJSON(parseInt(key), profs)); // name of teacher
            li.appendChild(text);
            li.classList.add("font-weight-bold");
            li.appendChild(document.createElement("br"));
            li.appendChild(document.createElement("br"));

            for (let i = 0; i < tab[key].length; i++) { // for each swap request assigned to the teacher
                let p = document.createElement("p");
                p.classList.add("font-weight-normal");

                let theOne = searchInEdt(tab[key][i][0]["elementDrop"].split("/")[0], tab[key][i][0]["elementDrop"].split("/")[1], tab[key][i][0]["elementDrop"].split("/")[2]); // get the first course in the edt database
                let theSecond = searchInEdt(tab[key][i][0]["elementDrag"].split("/")[0], tab[key][i][0]["elementDrag"].split("/")[1], tab[key][i][0]["elementDrag"].split("/")[2]); // get the second course in the edt database
                let date1 = printDatesOfWeek(theOne["heure"].split(" ")[0]);
                let hour1 = theOne["heure"].split(" ")[1].split(":");
                
                let date2 = printDatesOfWeek(theSecond["heure"].split(" ")[0]);
                let hour2 = theSecond["heure"].split(" ")[1].split(":");

                let insert = "Demande d'inversion du " + date1[0] + " " + date1[1] + " " + enMonthToFr(date1[2]) + " " + date1[3] + " à " + hour1[0] + "H" + hour1[1] + ", groupe " + getNameOfJSON(parseInt(theOne["idgroupe"]), groupes) + ", et du " + date2[0] + " " + date2[1] + " " + enMonthToFr(date2[2]) + " " + date2[3] + " à " + hour2[0] + "H" + hour2[1]; // set the swap request to a textual information
                let text2 = document.createTextNode(insert);
                p.appendChild(text2);
                p.appendChild(document.createElement("br"));

                let dateTemp = new Date();
                let date3 = printDatesOfWeek(dateTemp.getFullYear() + "-" + pad(dateTemp.getMonth()+1) + "-" + pad(dateTemp.getDate()));
                let hour3 = dateTemp.getHours() + ":" + dateTemp.getMinutes() + ":" + dateTemp.getSeconds();

                let insert2 = "Par " + tab[key][i][0]["actor"] + " le " + date3[0] + " " + date3[1] + " " + enMonthToFr(date3[2]) + " " + date3[3] + " à " + hour3.split(":")[0] + "H" + pad(hour3.split(":")[1]) + "."; // get the actor of this request and the date
                let text3 = document.createTextNode(insert2);
                p.appendChild(text3);

                let button1 = document.createElement("button"); // button to accept the request
                button1.type = "button";
                button1.classList.add("btn", "btn-success", "btn-deleteComment");
                button1.innerHTML = "&#10003";
                button1.setAttribute("onclick", "acceptDeplacement("+tab[key][i][1]+")");
                p.appendChild(button1);

                let button2 = document.createElement("button"); // button to deny the request and so to delete
                button2.type = "button";
                button2.classList.add("btn", "btn-danger", "btn-deleteComment");
                button2.innerHTML = "X";
                button2.setAttribute("onclick", "removeDeplaceOnSchedule("+tab[key][i][1]+")");
                p.appendChild(button2);


                li.appendChild(p);
            }
            ul.appendChild(li);
        }
        div.appendChild(ul);
    }
    card.appendChild(div);
    tbl.appendChild(card);
}

function removeDeplacements(indice) { // remove a swap request by the indice
    deplacements.splice(indice, 1);
}

function checkDemandeDeplacement(tab, object) { // remove a request from a swap request array if exists
    for (let i = 0; i < tab.length; i ++) { // for each element of the tab
        let firstEl = tab[i]["elementDrag"].split("/"); // get element of the first course
        let secondEl = tab[i]["elementDrop"].split("/"); // get element of the second course
        if ((object[0]["heure"].split(" ")[0] == firstEl[0]) && (object[0]["heure"].split(" ")[1] == firstEl[1]) && (object[0]["idgroupe"] == firstEl[2])) { // remove the swap request of the first element if exists in the tab
            tab.splice(i, 1);
        } else if ((object[0]["heure"].split(" ")[0] == secondEl[0]) && (object[0]["heure"].split(" ")[1] == secondEl[1]) && (object[0]["idgroupe"] == secondEl[2])) { // remove the swap request of the first element if exists in the tab
            tab.splice(i, 1);
        }
    }
}

function acceptDeplacement(indice) { // the action of accept a swap request
    if (!connected) { // check if a user is actualy connected
        alert("Merci de vous connecter !");
        return;
    }
    if (deplacements[indice]["accord"].toString() != ([0, 0]).toString()) {
        let crenDrag = searchInEdt(deplacements[indice]["elementDrag"].split("/")[0], deplacements[indice]["elementDrag"].split("/")[1], deplacements[indice]["elementDrag"].split("/")[2]); // get the first course that was dragged
        let crenDrop = searchInEdt(deplacements[indice]["elementDrop"].split("/")[0], deplacements[indice]["elementDrop"].split("/")[1], deplacements[indice]["elementDrop"].split("/")[2]); // get the second course that was dropped
        if (userConnected == getNameOfJSON(crenDrag["idprof"], profs)) { // if the user correspond to the drag element teacher
            if (deplacements[indice]["accord"][0] != 0) { // validate the first teacher choice if possible
                deplacements[indice]["accord"][0] = 0;
            } else { // alert if the user has already accepted
                alert("Vous avez déjà validé");
                return;
            }
        } else if (userConnected == getNameOfJSON(crenDrop["idprof"], profs)) { // if the user correspond to the drop element teacher
            if (deplacements[indice]["accord"][1] != 0) { // validate the second teacher choice if possible
                deplacements[indice]["accord"][1] = 0;
            } else { // alert if the user has already accepted
                alert("Vous avez déjà validé");
                return;
            }
        } else { // alert if the request is not for the actual user
            alert("Cette demande ne vous concerne pas !");
            return;
        }
    }
    if (deplacements[indice]["accord"].toString() == ([0, 0]).toString()) { // if both teachers have accepted
        intervertirBoth(true, indice); // swap both courses
        printDemandesDeplacements(); // print swap request
    }
}

function clickOnBtnConnexion() { // click on connexion button
    let btnConnected = document.getElementById("btn-connexion");
    document.getElementById("inputUser").value = ""; // set the user field to empty
    document.getElementById("inputMdp").value = ""; // set the password field to empty
    if (connected) { // disconnect the actual user
        connected = false; // the user is no longer connected
        userConnected = null; // reset the user connected to null
        btnConnected.classList.remove("btn-outline-danger");
        btnConnected.classList.add("btn-outline-success");
        btnConnected.innerHTML = "Se connecter"; // set the text connexion to log in
    } else { // set the popup connexion
        document.querySelector(".formConnexion").style.display = "flex";
        document.getElementById("main").style.opacity = "0.2";
        document.getElementById("headerNav").style.pointerEvents = "none";
        document.getElementById("main").style.pointerEvents = "none";
        
    }
}

function removeBtnConnexion() { // remove the popup connexion
    document.querySelector(".formConnexion").style.display = "none";
    document.getElementById("main").style.opacity = null;
    document.getElementById("headerNav").style.pointerEvents = null;
    document.getElementById("main").style.pointerEvents = null;
}

function checkConnexionCoord() { // check the user connexion
    let user = document.getElementById("inputUser").value; // set the user field
    let mdp = document.getElementById("inputMdp").value; // set the password field
    let btnConnected = document.getElementById("btn-connexion");
    if ((user !== "") && (mdp !== "")) { // if the fields are filled
        for (let i = 0; i < comptes.length; i++) { // for each user in the database
            if ((user == comptes[i]["mail"]) && (mdp == comptes[i]["mdp"])) { // if both coincide
                connected = true; // the user is connected
                userConnected = getNameOfJSON(comptes[i]["idprof"], profs); // set the user variable to the user name
                btnConnected.classList.remove("btn-outline-success");
                btnConnected.classList.add("btn-outline-danger");
                btnConnected.innerHTML = "Se déconnecter"; // set the text connexion to disconnected
                removeBtnConnexion(); // remove the popup
                return;
            }
        }
        alert("Nom d'utilisateur et/ou mot de passe incorrect(s)."); // the user is not in the database
        return;
    } else { // the two fields are not field
        alert("Merci de remplir les deux champs !");
        return;
    }
}