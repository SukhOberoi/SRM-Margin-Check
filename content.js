const SUBJECTMAP = {};

/**
 * @description Injects the analytics script into the page.
 * @returns {Promise<void>}
 */
async function injectAnalytics() {
	if (!localStorage.getItem("mixpanel_distinct_id")) {
		const distinctId = Date.now().toString();
		localStorage.setItem("mixpanel_distinct_id", distinctId);
	}

	const PAYLOAD = JSON.stringify({
		properties: {
			token: "3eec01e18d86ddd2a94b043de5658718",
			distinct_id: localStorage.getItem("mixpanel_distinct_id"),
			vendor: navigator.vendor,
		},
		event: "Times student portal made better",
	});

	const res = await fetch("https://api.mixpanel.com/track", {
		mode: "cors",
		credentials: "omit",
		cache: "no-store",
		redirect: "follow",
		method: "POST",
		body: new URLSearchParams({ data: PAYLOAD }).toString(),
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
	});

	if (!res.ok) {
		console.error("Failed to send analytics data to Mixpanel.");
		return;
	}
	console.log("Successfully sent analytics data to Mixpanel.");
}

/**
 * @param {number} totalConducted - The total number of hours conducted.
 * @param {number} absent - The number of hours absent.
 * @returns {number} - The margin required to maintain 75% attendance.
 * @description Calculates the margin required to maintain 75% attendance.
 * @example
 * const margin = calculateMargin(50, 10);
 * console.log(margin); // 1
 */
function calculateMargin(totalConducted, absent) {
	let margin = 0;
	let present = totalConducted - absent;
	let current = (present / totalConducted) * 100;
	let conducted = totalConducted;

	if (current > 75) {
		while (current >= 75) {
			conducted++;
			margin++;
			current = (present / conducted) * 100;
		}
		margin--;
	} else {
		while (current < 75) {
			conducted++;
			margin--;
			present++;
			current = (present / conducted) * 100;
		}
	}

	return margin;
}

/**
 * @param {string} selector - The CSS selector for the element to wait for.
 * @returns {Promise<Element>} - A promise that resolves to the element matching the selector.
 * @description Waits for an element to appear in the DOM and resolves the promise with the element.
 */
async function waitForElement(selector) {
	if (typeof selector !== "string") {
		throw new Error("The selector must be a string.");
	}

	return new Promise((resolve) => {
		const element = document.querySelector(selector);
		if (element) {
			resolve(element);
			return;
		}

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				observer.disconnect();
				resolve(element);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}

/**
 * @returns {Promise<void>}
 * @description Applies the magic to the student portal.
 */
async function applyMagicToStudentPortal() {
	const attendanceTable = await waitForElement(
		"#divMainDetails > div.container.mt-4 > div.card.mb-4 > div.card-body.p-0 > div > table",
	);
	const rows = attendanceTable.querySelectorAll(".card-body table tbody tr");
	const head = attendanceTable.querySelector(
		"#divMainDetails > div.container.mt-4 > div.card.mb-4 > div.card-body.p-0 > div > table > thead > tr",
	);
	const headCell = document.createElement("td");
	if (head.cells[2].innerHTML === "Max. hours") {
		headCell.innerHTML = "<strong>Margin</strong>";
		head.append(headCell);
	}
	for (const row of rows) {
		SUBJECTMAP[
			`${row.cells[0].innerHTML.substring(
				0,
				row.cells[0].innerHTML.indexOf("<br>"),
			)}`
		] = row.cells[1].textContent;
		const hoursConductedS = row.cells[2].textContent;
		const absentS = row.cells[4].textContent;
		const cell = document.createElement("td");
		const margin = calculateMargin(hoursConductedS, absentS);
		cell.textContent = `${margin}`;
		if (margin < 0) {
			cell.style.color = "red";
		}
		row.appendChild(cell);
	}
}

/**
 * @returns {Promise<void>}
 * @description Applies the magic to the Academia portal.
 */
/*async function applyMagicToAcademiaPortal() {
	if (!document.getElementById("margin-head")) {
		const attendanceTable = await waitForElement("table[bgcolor='#FAFAD2']");
		const marksTable = document.querySelector("p + table");
		const rows = attendanceTable.querySelectorAll("tbody tr:not(:first-child)");
		const head = attendanceTable.querySelector("tbody tr:first-child");
		const attendanceHeading = head.children[7];

		const headCell = document.createElement("td");
		headCell.id = "margin-head"
		headCell.innerHTML = "<strong>Margin</strong>";
		head.insertBefore(headCell, attendanceHeading.nextSibling);


		for (const row of rows) {
			SUBJECTMAP[
				`${row.cells[0].innerHTML.substring(
					0,
					row.cells[0].innerHTML.indexOf("<br>"),
				)}`
			] = row.cells[1].textContent;
			const hoursConductedS = row.cells[5].textContent;
			const absentS = row.cells[6].textContent;
			const cell = document.createElement("td");
			const margin = calculateMargin(hoursConductedS, absentS);
			cell.textContent = `${margin}`;
			if (margin < 0) {
				cell.style.color = "red";
			}
			cell.style.backgroundColor = "#E6E6FA";
			row.appendChild(cell);
			row.insertBefore(cell, row.children[7].nextSibling);
		}

		if (!marksTable) return;
		const marksRows = marksTable.querySelectorAll("tbody tr:not(:first-child)");

		for (const row of marksRows) {
			const nestedTable = row.querySelector("table table");

			row.cells[0].textContent += ` ${SUBJECTMAP[row.cells[0].textContent]}`;
			row.cells[0].style.textAlign = "left";

			if (!nestedTable) return;

			nestedTable.style.width = "100%";

			const cells = nestedTable.querySelectorAll('td font[size="1.5"]');

			let sum = 0;
			let totalMarks = 0;

			for (const cell of cells) {
				const number = Number.parseFloat(
					cell.innerHTML.substring(cell.innerHTML.lastIndexOf("<br>") + 4),
				);
				const max = Number.parseFloat(
					cell.innerHTML.substring(cell.innerHTML.indexOf("/") + 1),
					cell.innerHTML.indexOf("</strong>"),
				);
				if (!Number.isNaN(number)) {
					sum += number;
				}
				if (!Number.isNaN(max)) {
					totalMarks += max;
				}
			}

			const totalCell = document.createElement("td");
			totalCell.innerHTML = `<strong>${sum.toFixed(
				2,
			)}</strong> / ${totalMarks.toFixed(2)}`;
			totalCell.setAttribute("colspan", cells.length);
			totalCell.style.textAlign = "center";
			nestedTable.appendChild(totalCell);
		}
	}
}*/
/**
 * @returns {Promise<void>}
 * @description Applies the magic to the Academia portal.
 */
/*async function applyMagicToAcademiaPortal() {
    if (!document.getElementById("margin-head")) {
        const attendanceTable = await waitForElement("table[bgcolor='#FAFAD2']");
        const marksTable = document.querySelector("p + table");
        const rows = attendanceTable.querySelectorAll("tbody tr:not(:first-child)");
        const head = attendanceTable.querySelector("tbody tr:first-child");
        const attendanceHeading = head.children[7];

        const headCell = document.createElement("td");
        headCell.id = "margin-head";
        headCell.innerHTML = "<strong>Margin</strong>";
        head.insertBefore(headCell, attendanceHeading.nextSibling);

        for (const row of rows) {
            SUBJECTMAP[
                `${row.cells[0].innerHTML.substring(
                    0,
                    row.cells[0].innerHTML.indexOf("<br>"),
                )}`
            ] = row.cells[1].textContent;
            const hoursConductedS = row.cells[5].textContent;
            const absentS = row.cells[6].textContent;
            const cell = document.createElement("td");
            const margin = calculateMargin(hoursConductedS, absentS);
            cell.textContent = `${margin}`;
            if (margin < 0) {
                cell.style.color = "red";
            }
            cell.style.backgroundColor = "#E6E6FA";
            row.appendChild(cell);
            row.insertBefore(cell, row.children[7].nextSibling);

            // Add faculty name link functionality
            const facultyNameCell = row.cells[3]; // Assuming the faculty name is in the 4th column (index 3)
            const facultyName = facultyNameCell.textContent.trim();
            const facultyUrl = convertFacultyNameToUrl(facultyName);
            if (facultyUrl) {
                const link = document.createElement("a");
                link.href = facultyUrl;
                link.textContent = facultyName;
                link.target = "_blank"; // Open in a new tab
                facultyNameCell.innerHTML = ""; // Clear existing content
                facultyNameCell.appendChild(link);
            }
        }

        if (!marksTable) return;
        const marksRows = marksTable.querySelectorAll("tbody tr:not(:first-child)");

        for (const row of marksRows) {
            const nestedTable = row.querySelector("table table");

            row.cells[0].textContent += ` ${SUBJECTMAP[row.cells[0].textContent]}`;
            row.cells[0].style.textAlign = "left";

            if (!nestedTable) return;

            nestedTable.style.width = "100%";

            const cells = nestedTable.querySelectorAll('td font[size="1.5"]');

            let sum = 0;
            let totalMarks = 0;

            for (const cell of cells) {
                const number = Number.parseFloat(
                    cell.innerHTML.substring(cell.innerHTML.lastIndexOf("<br>") + 4),
                );
                const max = Number.parseFloat(
                    cell.innerHTML.substring(cell.innerHTML.indexOf("/") + 1),
                    cell.innerHTML.indexOf("</strong>"),
                );
                if (!Number.isNaN(number)) {
                    sum += number;
                }
                if (!Number.isNaN(max)) {
                    totalMarks += max;
                }
            }

            const totalCell = document.createElement("td");
            totalCell.innerHTML = `<strong>${sum.toFixed(
                2,
            )}</strong> / ${totalMarks.toFixed(2)}`;
            totalCell.setAttribute("colspan", cells.length);
            totalCell.style.textAlign = "center";
            nestedTable.appendChild(totalCell);
        }
    }
}*/
/**
 * @returns {Promise<void>}
 * @description Applies the magic to the Academia portal.
 */
/**
 * @returns {Promise<void>}
 * @description Applies the magic to the Academia portal.
 */
/**
 * @returns {Promise<void>}
 * @description Applies the magic to the Academia portal.
 */
async function applyMagicToAcademiaPortal() {
    const currentUrl = window.location.href;

    // Apply faculty name link functionality only on the "My Time Table 2023-24" page
    if (currentUrl.includes("#Page:My_Time_Table_2023_24")) {
        const table = await waitForElement("table.course_tbl");
        const rows = table.querySelectorAll("tbody tr:not(:first-child)"); // Skip the header row

        for (const row of rows) {
            const facultyNameCell = row.cells[7]; // Faculty name is in the 8th column (index 7)
            const facultyName = facultyNameCell.textContent.trim();
            const facultyUrl = convertFacultyNameToUrl(facultyName);

            if (facultyUrl) {
                const link = document.createElement("a");
                link.href = facultyUrl;
                link.textContent = facultyName;
                link.target = "_blank"; // Open in a new tab
                facultyNameCell.innerHTML = ""; // Clear existing content
                facultyNameCell.appendChild(link);
            }
        }
    } else if (currentUrl.includes("#Page:My_Attendance")) {
        // Apply only the margin calculation functionality for the "My Attendance" page
        if (!document.getElementById("margin-head")) {
            const attendanceTable = await waitForElement("table[bgcolor='#FAFAD2']");
            const rows = attendanceTable.querySelectorAll("tbody tr:not(:first-child)");
            const head = attendanceTable.querySelector("tbody tr:first-child");
            const attendanceHeading = head.children[7];

            const headCell = document.createElement("td");
            headCell.id = "margin-head";
            headCell.innerHTML = "<strong>Margin</strong>";
            head.insertBefore(headCell, attendanceHeading.nextSibling);

            for (const row of rows) {
                const hoursConductedS = row.cells[5].textContent;
                const absentS = row.cells[6].textContent;
                const cell = document.createElement("td");
                const margin = calculateMargin(hoursConductedS, absentS);
                cell.textContent = `${margin}`;
                if (margin < 0) {
                    cell.style.color = "red";
                }
                cell.style.backgroundColor = "#E6E6FA";
                row.appendChild(cell);
                row.insertBefore(cell, row.children[7].nextSibling);
            }
        }
    }
}

/**
 * @param {string} facultyName - The name of the faculty.
 * @returns {string} - The URL for the faculty's page.
 * @description Converts a faculty name into the corresponding faculty page URL.
 */
/**
 * @param {string} facultyName - The name of the faculty, possibly followed by an ID.
 * @returns {string} - The URL for the faculty's page.
 * @description Converts a faculty name into the corresponding faculty page URL, ignoring any trailing ID.
 */
/**
 * @param {string} facultyName - The name of the faculty, possibly followed by an ID or brackets.
 * @returns {string} - The URL for the faculty's page.
 * @description Converts a faculty name into the corresponding faculty page URL, ignoring any trailing ID or brackets.
 */
/**
 * @param {string} facultyName - The name of the faculty, possibly followed by an ID or brackets.
 * @returns {string} - The URL for the faculty's page.
 * @description Converts a faculty name into the corresponding faculty page URL, ignoring any trailing ID or brackets.
 */
/**
 * @param {string} facultyName - The name of the faculty, possibly followed by an ID or brackets.
 * @returns {string} - The URL for the faculty's page.
 * @description Converts a faculty name into the corresponding faculty page URL, ignoring any trailing ID or brackets.
 */
function convertFacultyNameToUrl(facultyName) {
    if (!facultyName) return null;

    // Extract only the faculty name (ignore any trailing ID, brackets, or numbers)
    const nameWithoutId = facultyName
        .replace(/\s*\(?\d+\)?.*$/, "") // Remove any numbers, brackets, or trailing characters after the name
        .trim(); // Remove leading/trailing spaces

    // Convert the faculty name to lowercase and replace spaces and dots with hyphens
    const formattedName = nameWithoutId
        .toLowerCase()
        .replace(/[\s.]+/g, "-") // Replace spaces and dots with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with a single hyphen
        .replace(/(^-|-$)/g, ""); // Remove leading or trailing hyphens

    return `https://www.srmist.edu.in/faculty/${formattedName}/`;
}

/**
 * @returns {Promise<void>}
 * @description The main function that runs when the content script is loaded.
 */
async function main() {
	const hostname = window.location.hostname;

	if (hostname === "academia.srmist.edu.in") {
		await applyMagicToAcademiaPortal();
		let currentUrl = window.location.href;
		// Function to check if the URL has changed
		async function checkUrlChange() {
			const newUrl = window.location.href;
			if (newUrl !== currentUrl) {
				currentUrl = newUrl;
				if (currentUrl == "https://academia.srmist.edu.in/#Page:My_Attendance")
				await applyMagicToAcademiaPortal(); // Reapply main function when URL changes
			}
		}
		window.addEventListener("popstate", checkUrlChange);
		console.log(
			"%cMaking Academia Better Now",
			"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;"
		);
	}

	if (hostname === "sp.srmist.edu.in") {
		await applyMagicToStudentPortal();
		console.log(
			"%cMaking Student Portal Better Now",
			"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;"
		);
	}

	console.log(
		"%cIf you are seeing this message, you are awesome!",
		"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;"
	);

	console.log(
		"%cRaise any issues or contribute to the project at https://github.com/SukhOberoi/SRM-Margin-Check",
		"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;"
	);

	await injectAnalytics();
}

main();
