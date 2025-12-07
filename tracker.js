javascript:(function(){
    /* --- Configuration --- */
    var TARGET_TEXT_VARIANTS = ["Show All", "All Trips", "All"];
    
    /* --- Step 1: Identify the Dropdown --- */
    var dropdowns = document.querySelectorAll('button[role="combobox"]');
    var filterBtn = dropdowns[1]; /* Assumes 2nd dropdown is the filter */
    
    if (!filterBtn) {
        /* showFloatingAssistant("I couldn't find the dropdown button. Please filter for 'Show All Trips' manually, then click Continue."); */
        showFloatingAssistant("Please select 'Show All Trips' instead of 'Trips with Purchases' from the dropdown menu, then click Continue.");
        return;
    }

    /* Check if already correct */
    var currentText = filterBtn.innerText.toLowerCase();
    if (currentText.includes("show all") || currentText.includes("all trips")) {
        runDeepSearch();
        return;
    }

    /* --- Step 2: Attempt Auto-Select --- */
    filterBtn.click();
    
    setTimeout(function(){
        var options = document.querySelectorAll('[role="option"], [role="menuitem"], li');
        var foundOption = null;

        for (var i = 0; i < options.length; i++) {
            var txt = options[i].innerText.toLowerCase();
            if (txt.includes("show all") || txt.includes("all trips")) {
                foundOption = options[i];
                break;
            }
        }

        if (foundOption) {
            foundOption.click();
            /* Wait for table reload then run */
            setTimeout(runDeepSearch, 1500);
        } else {
            /* --- FALLBACK: Non-Blocking UI --- */
            /* showFloatingAssistant("I opened the menu but couldn't find the option.<br>Please select <b>'Show All Trips'</b> manually.<br>Then click <b>Continue</b>."); */
            showFloatingAssistant("Please select 'Show All Trips' instead of 'Trips with Purchases' from the dropdown menu, then click Continue.");
        }
    }, 800);

    /* --- UI Helper: Floating Assistant --- */
    function showFloatingAssistant(message) {
        var existing = document.getElementById('c1-helper-ui');
        if (existing) existing.remove();

        var box = document.createElement('div');
        box.id = 'c1-helper-ui';
        box.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#e6f0ff; border:2px solid #007bff; color:#003366; padding:20px; border-radius:8px; z-index:999999; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-family:sans-serif; text-align:center; min-width:300px;';
        
        var msg = document.createElement('div');
        msg.innerHTML = message;
        msg.style.marginBottom = '15px';
        msg.style.fontSize = '14px';
        
        var btn = document.createElement('button');
        btn.innerText = "Continue";
        btn.style.cssText = 'background:#007bff; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:14px;';
        
        btn.onclick = function() {
            btn.innerText = "Processing...";
            setTimeout(function(){
                runDeepSearch();
                box.remove();
            }, 500);
        };
        
        var close = document.createElement('div');
        close.innerText = '×';
        close.style.cssText = 'position:absolute; top:5px; right:10px; cursor:pointer; font-weight:bold; font-size:20px; color:#999;';
        close.onclick = function(){ box.remove(); };

        box.appendChild(close);
        box.appendChild(msg);
        box.appendChild(btn);
        document.body.appendChild(box);
    }

    /* --- Logic: Deep Search & Merge --- */
    function runDeepSearch() {
        var rawData = findDataInReact(document.querySelector('table')) || findGlobalData();

        if (!rawData) {
            alert('Data not found in memory. Please ensure the table is loaded.');
            return;
        }
        processData(rawData);
    }

    /* --- React Walkers --- */
    function findDataInReact(domElement) {
        if (!domElement) return null;
        var key = Object.keys(domElement).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (!key) return null;
        var fiber = domElement[key];
        var maxDepth = 50;
        var curr = fiber;
        while (curr && maxDepth > 0) {
            var p = curr.memoizedProps;
            if (p) { var attempt = checkObjectForData(p); if (attempt) return attempt; }
            var s = curr.memoizedState;
            while (s) {
                if (s.memoizedState) {
                    var attempt = checkObjectForData(s.memoizedState);
                    if (attempt) return attempt;
                    if (Array.isArray(s.memoizedState) && isTripArray(s.memoizedState)) return s.memoizedState;
                }
                s = s.next;
            }
            curr = curr.return;
            maxDepth--;
        }
        return null;
    }

    function findGlobalData() {
        try {
            if (window.__remixContext && window.__remixContext.state && window.__remixContext.state.loaderData) {
                var loaders = window.__remixContext.state.loaderData;
                for (var key in loaders) {
                    var val = checkObjectForData(loaders[key]);
                    if (val) return val;
                }
            }
        } catch(e) {}
        return null;
    }

    function checkObjectForData(obj) {
        if (!obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj) && isTripArray(obj)) return obj;
        for (var key in obj) {
            if (Array.isArray(obj[key]) && isTripArray(obj[key])) return obj[key];
        }
        return null;
    }

    function isTripArray(arr) {
        return arr.length > 0 && arr[0] && typeof arr[0] === 'object' && 'tripId' in arr[0];
    }

    function processData(data) {
        var map = {};
        data.forEach(function(item){
            var tid = item.tripId;
            if(!tid) return;
            if (!map[tid]) {
                map[tid] = item;
            } else {
                if (map[tid].orderAmount === null && item.orderAmount !== null) {
                    map[tid] = item;
                }
            }
        });

        var table = document.querySelector('table');
        if(!table) return alert('Table not found.');
        
        var theadRow = table.querySelector('thead tr');
        var columnsExist = theadRow.innerText.indexOf('Status (API)') !== -1;

        /* Define new columns (Added Order Number) */
        var newHeaders = ['Order Number (API)', 'Status (API)', 'Order Amount (API)', 'Credit Amount (API)'];

        if (!columnsExist) {
            var thTemplate = theadRow.children[1].cloneNode(true);
            newHeaders.forEach(function(headerTitle){
                var th = thTemplate.cloneNode(true);
                var textNode = th.querySelector('h4') || th;
                textNode.innerText = headerTitle;
                theadRow.appendChild(th);
            });
        }

        var tbodyRows = table.querySelectorAll('tbody tr');
        var cellTemplate = tbodyRows[0].children[1].cloneNode(true);
        var matchCount = 0;
        
        tbodyRows.forEach(function(row){
            var cells = row.querySelectorAll('td');
            if(cells.length < 5) return;
            if (columnsExist && cells.length > 9) return;

            var tripId = cells[4].innerText.trim();
            var entry = map[tripId];
            
            /* Extract Data */
            var orderNum = (entry && entry.orderId) ? entry.orderId : '-';
            var status = entry ? entry.status : '-';
            var orderAmt = (entry && entry.orderAmount !== null) ? '$' + entry.orderAmount : '-';
            var creditAmt = (entry && entry.creditAmount !== null) ? '$' + entry.creditAmount : '-';
            
            [orderNum, status, orderAmt, creditAmt].forEach(function(val){
                var td = cellTemplate.cloneNode(true);
                td.innerText = val;
                row.appendChild(td);
            });
            if(entry) matchCount++;
        });
        
        setTimeout(function(){ console.log('Success! Updated ' + matchCount + ' rows.'); }, 200);
    }
})();