//copied from https://sql.js.org/examples/GUI/index.html

var execBtn = document.getElementById("btnSearch");
var txtSearch = document.getElementById("txtSearch");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var dbFileElm = document.getElementById('dbFile');
var lblImportedFile = document.getElementById('lblImportedFile');
var startingImgId;

// Start the worker in which sql.js will run
var worker = new Worker("worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: 'open' });

// Connect to the HTML element we 'print' to
function print(text) {
	outputElm.innerHTML = text.replace(/\n/g, '<br>');
}
function error(e) {
	console.log(e);
	errorElm.style.height = '2em';
	errorElm.textContent = e.message;
}

function noerror() {
	errorElm.style.height = '0';
}

// Run a command in the database
function execute(commands) {
	tic();
	worker.onmessage = function (event) {
		var results = event.data.results;
		toc("Executing SQL");
		if (!results) {
			error({message: event.data.error});
			return;
		}

		tic();
		outputElm.innerHTML = "";
		if (results.length == 0)
		{
			outputElm.innerHTML = "No entries found for " + txtSearch.value + ". Try another term.";
		}
		else
		{
			outputElm.innerHTML = results[0].values.length + " entries found for " + txtSearch.value + ". <br />";
		}

		for (var i = 0; i < results.length; i++) {
			outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
		}

		//turn 1st column values into links
		var tds = document.querySelectorAll('table tbody td:nth-child(1)');
		for(var i = 0; i < tds.length; i++)
		{
			var imgId = startingImgId + parseInt(tds[i].textContent);
			//webClient.DownloadFile($"https://images.nypl.org/index.php?id={imgId}&t=w", destinationFileName);
			tds[i].innerHTML = `<a target="_blank" rel="noopener noreferrer" href='https://images.nypl.org/index.php?id=${imgId}&t=w'>` + tds[i].textContent + "</a>"
		}

		toc("Displaying results");
	}
	worker.postMessage({ action: 'exec', sql: commands });
	outputElm.textContent = "Fetching results...";
}

// Create an HTML table
var tableCreate = function () {
	function valconcat(vals, tagName) {
		if (vals.length === 0) return '';
		var open = '<' + tagName + '>', close = '</' + tagName + '>';
		return open + vals.join(close + open) + close;
	}
	return function (columns, values) {
		var tbl = document.createElement('table');
		var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
		var rows = values.map(function (v) { return valconcat(v, 'td'); });
		html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
		tbl.innerHTML = html;
		return tbl;
	}
}();

// Execute the commands when the button is clicked
function execEditorContents() {
/*
	var data = (async function()
	{
		let db = await getDBConnection();
		let results = await db.all("SELECT p.Number as Page, l.Number as Line, w.Number as Word FROM Page p  JOIN Line l on p.Id = l.PageId JOIN Word w on w.LineId = l.Id WHERE w.Text = + '" + txtSearch.value  + "';");
		await db.close();
		return JSON(results);
	})();
	
	return;
*/
	noerror()
	execute("SELECT p.Number as Page, l.Number as Line, w.Number as Word FROM Page p  JOIN Line l on p.Id = l.PageId JOIN Word w on w.LineId = l.Id WHERE w.Text = + '" + txtSearch.value  + "';");
}
execBtn.addEventListener("click", execEditorContents, true);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
}

// Load a db from a file
dbFileElm.onchange = function () {
	var f = dbFileElm.files[0];
	var r = new FileReader();
	r.onload = function () {
		worker.onmessage = function () {
			toc("Loading database from file");
		};
		tic();
		try {
			worker.postMessage({ action: 'open', buffer: r.result }, [r.result]);
			btnSearch.removeAttribute('disabled');
			lblImportedFile.textContent = f.name;
			startingImgId = parseInt(dbFileElm.files[0].name.split('-')[1].replace(/\.[^/.]+$/, ""));
			
		}
		catch (exception) {
			worker.postMessage({ action: 'open', buffer: r.result });
		}
	}
	r.readAsArrayBuffer(f);
}

/*
var SQL = (async function()
{
	return await initSqlJs({
		// Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
		// You can omit locateFile completely when running in node
		locateFile: file => 'sql-wasm.wasm'
	  });
})();

async function getDBConnection(){
    const db = await sqlite.open({
        filename: "/books/Secureni-56632812.db",
        driver: sqlite3.Database
    });
    return db;
}
*/