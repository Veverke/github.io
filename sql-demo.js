//copied from https://sql.js.org/examples/GUI/index.html
var select = document.getElementById("dbSelect");
var btnSearch = document.getElementById("btnSearch");
var txtSearch = document.getElementById("txtSearch");
var outputElm = document.getElementById('output');
var errorElm = document.getElementById('error');
var startingImgId;

startingImgId = parseInt(select.value.split('-')[1].replace(/\.[^/.]+$/, ""));

select.addEventListener("change", (e) => 
{
	startingImgId = parseInt(e.target.value.split('-')[1].replace(/\.[^/.]+$/, ""));
	outputElm.innerHTML = "";
});

txtSearch.addEventListener("keyup", () => 
{
	if (!txtSearch.value)
	{
		btnSearch.setAttribute('disabled','disabled');
	}
	else
	{
		btnSearch.removeAttribute('disabled');
	}
});

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

btnSearch.addEventListener("click", () => 
{
	noerror()
	//execute("SELECT p.Number as Page, l.Number as Line, w.Number as Word FROM Page p  JOIN Line l on p.Id = l.PageId JOIN Word w on w.LineId = l.Id WHERE w.Text = + '" + txtSearch.value  + "';");

	var xhr = new XMLHttpRequest();
	xhr.open('GET', "books/" + select.value + ".db", true);
	xhr.responseType = 'arraybuffer';

	xhr.onload = function(e) {
		var uInt8Array = new Uint8Array(this.response);
		var db = new SQL.Database(uInt8Array);
		var data = db.exec("SELECT p.Number as Page, l.Number as Line, w.Number as Word FROM Page p  JOIN Line l on p.Id = l.PageId JOIN Word w on w.LineId = l.Id WHERE w.Text = + '" + txtSearch.value  + "';");
		// contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]

		var bookName = select.value.split('-')[0];
		var results = data;
		toc("Executing SQL");
		if (results && results.length == 0) {
			error({message: "No entries found for '" + txtSearch.value + "' on " + bookName + " db. Try another term."});
			return;
		}

		tic();
		outputElm.innerHTML = "";
		outputElm.innerHTML = results[0].values.length + " entries found for <b>" + txtSearch.value + "</b> on <u>" + bookName + "</u> book. <br /><br />";

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

	};
	xhr.send();
}, true);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) { window.performance = { now: Date.now } }
function tic() { tictime = performance.now() }
function toc(msg) {
	var dt = performance.now() - tictime;
	console.log((msg || 'toc') + ": " + dt + "ms");
}