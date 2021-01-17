const GP_KEY = "gp";
const PRIO_KEY = "prio";
const WOW_ID_KEY = "wowID";
const WOW_HEAD_LINK = "https://classic.wowhead.com/";
const BASE_REQUEST_LINK = "https://bendriller.github.io/";
const JSON_REQUEST_MAP = {"naxx":"KTLOSNaxxLoot.json", "aq40" : "KTLOSAQ40Loot.json", "bwl": "KTLOSBWLLoot.json", "mc":"KTLOSMCLoot.json", "wb":"KTLOSWorldBossLoot.json"};
const RAID_NAME_MAP = {"naxx" : "Naxxramas","wb" : "World Boss","aq40" : "Temple of Ahn'Qiraj", "bwl": "Blackwing Lair", "mc":"Molten Core"};
const WOWHEAD_JS = "https://wow.zamimg.com/widgets/power.js";

const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true};

var jsonCache = new Map();
var lastFilterValue = "";
var lastRaid = "naxx";

function loadJsonAndRender(raidName) {
	lastRaid = raidName;
	if (jsonCache[raidName] != null) {
		clearDataSection();
		process(jsonCache[raidName], raidName);
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.onreadystatechange = function(e) {
		if (this.readyState == 4 && this.status == 200) {
			clearDataSection();
			process(this.response, raidName);
			jsonCache[raidName] = this.response;
		}
	}
	let jsonUrl = BASE_REQUEST_LINK + JSON_REQUEST_MAP[raidName];
	xhr.open('GET', jsonUrl);
	xhr.send();
}

function loadNaxx() {
	loadJsonAndRender("naxx");
}

function loadBWL() {
	loadJsonAndRender("bwl");
}

function loadAQ40() {
	loadJsonAndRender("aq40");
}

function loadMC() {
	loadJsonAndRender("mc");
}

function loadWorldBoss() {
	loadJsonAndRender("wb");
}

function clearDataSection() {
	var dataSection = document.getElementById("data-section");
	if (dataSection != undefined) {
		dataSection.remove();
	}
	var raidHeader = document.getElementById("raid-header");
	if (raidHeader != undefined) {
		raidHeader.remove();
	}
}

function process(data, raidName) {
	renderTable(data, raidName);
	reloadWowheadScript();
}

function reloadWowheadScript() {
    $('script[src="' + WOWHEAD_JS + '"]').remove();
    $('<script>').attr('src', WOWHEAD_JS).appendTo('head');
}

function filterBy() {
	let filterValue = document.getElementById("filter-input").value.trim();
	lastFilterValue = filterValue;
	loadJsonAndRender(lastRaid);
}

function renderTable(dataMap, raidName) {
	const dataWrapper = document.querySelector("#data-wrapper");

	let raidHeader = document.createElement("div");
	raidHeader.setAttribute("id","raid-header");
	dataWrapper.appendChild(raidHeader);
	raidHeader.innerText = RAID_NAME_MAP[raidName];

	let dataSection = document.createElement("table");
	dataSection.setAttribute("id","data-section");
	dataWrapper.appendChild(dataSection);

	for (var boss in dataMap) {
		let bossRow = document.createElement("tr");
		let bossTd = document.createElement("td");
		bossTd.innerText = boss;
		bossTd.classList.add("boss-header");
		bossRow.appendChild(bossTd);
		dataSection.appendChild(bossRow);

		let bossItems = document.createElement("td");

		bossRow.appendChild(bossItems);
		let bossTable = document.createElement("table");
		bossTable.classList.add("boss-table");
		bossItems.appendChild(bossTable);

		var isEven = true;
		var isBossRelevant = false;
		var isBossSelected = boss.trim().toLowerCase().includes(lastFilterValue.trim().toLowerCase());

		for (var item in dataMap[boss]) {
			let itemTr = document.createElement("tr");
			if (isEven) { 
				itemTr.classList.add("even");
			}
			isEven = !isEven;
			let gpHeader = document.createElement("td");

			let gpValue = dataMap[boss][item][GP_KEY] == undefined 
			 ? (dataMap[boss][item][GP_KEY + ":"] == undefined ? "" : dataMap[boss][item][GP_KEY + ":"]) 
			 : dataMap[boss][item][GP_KEY];
			gpHeader.classList.add("gp-header");
			gpHeader.innerText = "(GP: " + gpValue + ")";
			gpHeader.classList.add("prio");
			itemTr.appendChild(gpHeader);

			let itemHeader = document.createElement("td");
			itemHeader.classList.add("item-header");
			itemHeader.classList.add("prio");
			
			if (dataMap[boss][item][WOW_ID_KEY] != 0) {
				let wowIdKey = "item=" + dataMap[boss][item][WOW_ID_KEY];
				let itemAnchor = document.createElement('a');  
				itemHeader.appendChild(itemAnchor);
				itemAnchor.href = (WOW_HEAD_LINK + wowIdKey);
				itemAnchor.setAttribute("data-wowhead", wowIdKey);
				itemAnchor.innerText = item;
			} else {
				itemHeader.innerText = item;
			}		

			bossTable.appendChild(itemTr);
			itemTr.appendChild(itemHeader);

			var isNameRelevant = isBossSelected || (lastFilterValue === "" || item.trim().toLowerCase().includes(lastFilterValue.trim().toLowerCase()));
			for (var prioIndex in dataMap[boss][item][PRIO_KEY]) {
				let prio = dataMap[boss][item][PRIO_KEY][prioIndex];
				let prioTd = document.createElement("td");
				prioTd.classList.add("prio");
				prioTd.innerText = prio;
				itemTr.appendChild(prioTd);

				if (lastFilterValue === "") {
					isNameRelevant = true;
				}
				isNameRelevant = isNameRelevant || (prio.trim().toLowerCase().includes(lastFilterValue.trim().toLowerCase()));
			}

			if (!isNameRelevant) {
				itemTr.classList.add("hidden");
			}
			isBossRelevant = isBossRelevant || isNameRelevant;
		}
		if (!isBossRelevant && !isBossSelected) {
			bossRow.classList.add("hidden");
		}
	}
}

// By default render lastRaid;
loadJsonAndRender(lastRaid);
