# Capital One Shopping Trips Tracker

A Javascript bookmarklet that reveals hidden data on the Capital One Shopping Trips dashboard. It accesses the internal React state of the webpage to populate the table with "Order Number," "Real Status," and precise "Order/Credit Amounts" that are hidden from the standard UI.

## Features

  * **Reveals Hidden Columns:** Adds four new columns to your transaction table:
      * `Order Number (API)`
      * `Status (API)` (Often shows detailed status like "Pending" or "Ineligible" before the UI updates)
      * `Order Amount (API)`
      * `Credit Amount (API)`
  * **Filter Automation:** Automatically attempts to switch the dashboard view to "Show All Trips" to ensure all data is captured.
  * **Floating Assistant UI:** If the script cannot auto-select the dropdown (due to UI library variations), it provides a non-blocking floating "Assistant" box to guide you without freezing the page.
  * **Privacy Focused:** Does not make network requests. It strictly reads data already loaded in your browser's memory.

## 🛠 Installation

1.  Create a new bookmark in your browser (Chrome, Firefox, Edge, Safari).
2.  Name it "C1 Offers Tracker", or anything you'd like to name it.
3.  In the URL (or Target) field, paste the Javascript code below.

### The Code

*(Copy the entire block below)*

```javascript
javascript:(function(){var TARGET_TEXT_VARIANTS=["Show All","All Trips","All"];var dropdowns=document.querySelectorAll('button[role="combobox"]');var filterBtn=dropdowns[1];if(!filterBtn){showFloatingAssistant("I couldn't find the dropdown button. Please filter for 'Show All Trips' manually, then click Continue.");return}var currentText=filterBtn.innerText.toLowerCase();if(currentText.includes("show all")||currentText.includes("all trips")){runDeepSearch();return}filterBtn.click();setTimeout(function(){var options=document.querySelectorAll('[role="option"], [role="menuitem"], li');var foundOption=null;for(var i=0;i<options.length;i++){var txt=options[i].innerText.toLowerCase();if(txt.includes("show all")||txt.includes("all trips")){foundOption=options[i];break}}if(foundOption){foundOption.click();setTimeout(runDeepSearch,1500)}else{showFloatingAssistant("I opened the menu but couldn't find the option.<br>Please select <b>'Show All Trips'</b> manually.<br>Then click <b>Continue</b>.")}},800);function showFloatingAssistant(message){var existing=document.getElementById('c1-helper-ui');if(existing)existing.remove();var box=document.createElement('div');box.id='c1-helper-ui';box.style.cssText='position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#e6f0ff; border:2px solid #007bff; color:#003366; padding:20px; border-radius:8px; z-index:999999; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-family:sans-serif; text-align:center; min-width:300px;';var msg=document.createElement('div');msg.innerHTML=message;msg.style.marginBottom='15px';msg.style.fontSize='14px';var btn=document.createElement('button');btn.innerText="Continue";btn.style.cssText='background:#007bff; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;';btn.onclick=function(){btn.innerText="Processing...";setTimeout(function(){runDeepSearch();box.remove()},500)};var close=document.createElement('div');close.innerText='×';close.style.cssText='position:absolute; top:5px; right:10px; cursor:pointer; font-weight:bold; font-size:20px; color:#999;';close.onclick=function(){box.remove()};box.appendChild(close);box.appendChild(msg);box.appendChild(btn);document.body.appendChild(box)}function runDeepSearch(){var rawData=findDataInReact(document.querySelector('table'))||findGlobalData();if(!rawData){alert('Data not found in memory. Please ensure the table is loaded.');return}processData(rawData)}function findDataInReact(domElement){if(!domElement)return null;var key=Object.keys(domElement).find(k=>k.startsWith('__reactFiber')||k.startsWith('__reactInternalInstance'));if(!key)return null;var fiber=domElement[key];var maxDepth=50;var curr=fiber;while(curr&&maxDepth>0){var p=curr.memoizedProps;if(p){var attempt=checkObjectForData(p);if(attempt)return attempt}var s=curr.memoizedState;while(s){if(s.memoizedState){var attempt=checkObjectForData(s.memoizedState);if(attempt)return attempt;if(Array.isArray(s.memoizedState)&&isTripArray(s.memoizedState))return s.memoizedState}s=s.next}curr=curr.return;maxDepth--}return null}function findGlobalData(){try{if(window.__remixContext&&window.__remixContext.state&&window.__remixContext.state.loaderData){var loaders=window.__remixContext.state.loaderData;for(var key in loaders){var val=checkObjectForData(loaders[key]);if(val)return val}}}catch(e){}return null}function checkObjectForData(obj){if(!obj||typeof obj!=='object')return null;if(Array.isArray(obj)&&isTripArray(obj))return obj;for(var key in obj){if(Array.isArray(obj[key])&&isTripArray(obj[key]))return obj[key]}return null}function isTripArray(arr){return arr.length>0&&arr[0]&&typeof arr[0]==='object'&&'tripId'in arr[0]}function processData(data){var map={};data.forEach(function(item){var tid=item.tripId;if(!tid)return;if(!map[tid]){map[tid]=item}else{if(map[tid].orderAmount===null&&item.orderAmount!==null){map[tid]=item}}});var table=document.querySelector('table');if(!table)return alert('Table not found.');var theadRow=table.querySelector('thead tr');var columnsExist=theadRow.innerText.indexOf('Status (API)')!==-1;var newHeaders=['Order Num (API)','Status (API)','Order Amt (API)','Credit Amt (API)'];if(!columnsExist){var thTemplate=theadRow.children[1].cloneNode(true);newHeaders.forEach(function(headerTitle){var th=thTemplate.cloneNode(true);var textNode=th.querySelector('h4')||th;textNode.innerText=headerTitle;theadRow.appendChild(th)})}var tbodyRows=table.querySelectorAll('tbody tr');var cellTemplate=tbodyRows[0].children[1].cloneNode(true);var matchCount=0;tbodyRows.forEach(function(row){var cells=row.querySelectorAll('td');if(cells.length<5)return;if(columnsExist&&cells.length>9)return;var tripId=cells[4].innerText.trim();var entry=map[tripId];var orderNum=(entry&&entry.orderId)?entry.orderId:'-';var status=entry?entry.status:'-';var orderAmt=(entry&&entry.orderAmount!==null)?'$'+entry.orderAmount:'-';var creditAmt=(entry&&entry.creditAmount!==null)?'$'+entry.creditAmount:'-';[orderNum,status,orderAmt,creditAmt].forEach(function(val){var td=cellTemplate.cloneNode(true);td.innerText=val;row.appendChild(td)});if(entry)matchCount++});setTimeout(function(){alert('Success! Updated '+matchCount+' rows.')},200)}})();
```

## Usage

1.  Log in to your Capital One account and navigate to the Shopping Trips page.
2.  Click the bookmark you created.
3.  **Automatic Mode:** The script will attempt to select "Show All Trips" and immediately populate the data.
4.  **Manual Mode:** If the script cannot control the dropdown menu, a blue box will appear at the top of the screen.
      * Manually select "Show All Trips" in the page dropdown.
      * Click Continue on the blue box.
5.  Scroll to the right of the table to see the 4 new data columns.

## How It Works

This tool does not use a public API or scrape the screen visually. Instead, it utilizes React Fiber Traversal.

1.  **State Lookup:** Modern web apps (like Capital One's) store data in memory (the JavaScript Heap) to render the page efficiently.
2.  **Tree Walking:** The script locates the HTML `<table>` element and finds the internal React instance attached to it. It then "walks" up the component tree until it finds the raw data array containing the shopping trips.
3.  **Data Mapping:** It maps this raw data to the visible rows based on `Trip ID`, extracting fields that exist in the database but are hidden from the UI (like `orderId` or rejected reasons).
4.  **Priority Handling:** The script handles duplicate data entries by prioritizing records that contain valid numerical amounts over `null` placeholders.

## Disclaimer & Privacy

  * **No Data Collection:** This script runs entirely within your browser. **No data is sent to any external server.**
  * **Volatile:** This relies on the internal structure of the Capital One website. If they update their website code, this bookmarklet may stop working.
  * **Not Affiliated:** This project is not affiliated with, endorsed by, or connected to Capital One. Use at your own risk.