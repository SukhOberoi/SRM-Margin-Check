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
async function applyMagicToAcademiaPortal() {
	const attendanceTable = await waitForElement("table[bgcolor='#FAFAD2']");
	const marksTable = document.querySelector("p + table");
	const rows = attendanceTable.querySelectorAll("tbody tr:not(:first-child)");
	const head = attendanceTable.querySelector("tbody tr:first-child");

	const headCell = document.createElement("td");
	headCell.innerHTML = "<strong>Margin</strong>";
	head.append(headCell);

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

/**
 * @returns {Promise<void>}
 * @description The main function that runs when the content script is loaded.
 */
async function main() {
	const hostname = window.location.hostname;

	if (hostname === "academia.srmist.edu.in") {
		await applyMagicToAcademiaPortal();
		console.log(
			"%cMaking Academia Better Now",
			"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;",
		);
	}

	if (hostname === "sp.srmist.edu.in") {
		await applyMagicToStudentPortal();
		console.log(
			"%cMaking Student Portal Better Now",
			"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;",
		);
	}

	console.log(
		"%cIf you are seeing this message, you are awesome!",
		"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;",
	);

	console.log(
		"%cRaise any issues or contribute to the project at https://github.com/SukhOberoi/SRM-Margin-Check",
		"color: #bada55; font-size: 20px; font-weight: bold; font-family: 'Comic Sans MS', 'Comic Sans', cursive;",
	);

	await injectAnalytics();
}

main();
