console.log("loaded");
let hasRunSuccessfully = false;
let subjectNames = {};


if (!localStorage.getItem('mixpanel_distinct_id')) {
    const distinctId = Date.now().toString();
    localStorage.setItem('mixpanel_distinct_id', distinctId);
}
const MIXPANEL_TOKEN = '3eec01e18d86ddd2a94b043de5658718';
const navigatorVendor = navigator.vendor;


const calculateMargin = (totalConducted, absent) => {
    let conducted = totalConducted
    let abs = absent
    let present = conducted - abs;
    let current = present / conducted * 100
    margin = 0
    if (current > 75) {
        while (current >= 75) {
            conducted++;
            margin++;
            current = present / conducted * 100;
        }
        margin--;
    } else {
        while (current < 75) {
            conducted++;
            margin--;
            present++;
            current = present / conducted * 100;
        }
    }
    return margin;
}


function everything() {

    console.log("Making Academia Better Now");
    const attendanceTable = document.querySelector('table[bgcolor="#FAFAD2"]');
    const marksTable = document.querySelector('p + table');

    if (attendanceTable) {

        const rows = attendanceTable.querySelectorAll('tbody tr:not(:first-child)');
        const head = attendanceTable.querySelector('tbody tr:first-child');
        let headcell = document.createElement('td');
        headcell.innerHTML = '<strong>Margin</strong>';
        head.append(headcell);
        rows.forEach(function (row) {
            //logic for calculating margin and saving course id and name in a json
            subjectNames[`${row.cells[0].innerHTML.substring(0, row.cells[0].innerHTML.indexOf("<br>"))}`] = row.cells[1].textContent;
            let hoursConductedS = row.cells[5].textContent;
            let absentS = row.cells[6].textContent;
            let cell = document.createElement('td');
            let margin = calculateMargin(hoursConductedS, absentS);
            cell.textContent = `${margin}`;
            if (margin < 0) {
                cell.style.color = "red";
            }
            row.appendChild(cell);
        });
    }

    if (marksTable) {
        const rows = marksTable.querySelectorAll('tbody tr:not(:first-child)');

        rows.forEach(function (row) {
            // Find the innermost table in the current row
            const innermostTable = row.querySelector('table table');
            row.cells[0].textContent += ` ${subjectNames[row.cells[0].textContent]}`;
            row.cells[0].style.textAlign = "left";

            // Check if the innermost table exists
            if (innermostTable) {
                // Find all cells in the innermost table
                const cells = innermostTable.querySelectorAll('td font[size="1.5"]');

                // Calculate the sum of the numbers
                let sum = 0;
                let totalMarks = 0;
                cells.forEach(function (cell) {
                    const number = parseFloat(cell.innerHTML.substring(cell.innerHTML.lastIndexOf("<br>") + 4));
                    const max = parseFloat(cell.innerHTML.substring(cell.innerHTML.indexOf("/") + 1), cell.innerHTML.indexOf("</strong>"));
                    if (!isNaN(number)) {
                        sum += number;
                    }
                    if (!isNaN(max)) {
                        totalMarks += max;
                    }
                });

                // Create a new cell for the total and append it to the innermost table
                const totalCell = document.createElement('td');
                totalCell.textContent = `${sum.toFixed(2)} / ${totalMarks.toFixed(2)}`; // Display the total with two decimal places
                innermostTable.appendChild(totalCell);
            }
        });
    }
    sendanalytics();

}


function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

waitForElm('table[bgcolor="#FAFAD2"]').then((elm) => {
    everything();
});



function sendanalytics() {

    const payload = {
        properties: {
            token: `${MIXPANEL_TOKEN}`,
            distinct_id: `${localStorage.getItem('mixpanel_distinct_id')}`,
            vendor: `${navigatorVendor}`
        },
        event: 'Times academia made better'
    };
    const data = JSON.stringify(payload);
    fetch('https://api.mixpanel.com/track', {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        redirect: 'follow',
        method: 'POST',
        body: (new URLSearchParams({ data })).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}
