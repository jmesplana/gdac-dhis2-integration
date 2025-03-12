document.addEventListener('DOMContentLoaded', function() {

    // First, check if marked is available and initialize it properly
    if (typeof marked !== 'undefined') {
        console.log("Marked version:", marked.version);
        // Ensure marked.parse is available (in some versions it's marked.parse, in others just marked)
        if (!marked.parse && typeof marked === 'function') {
            marked.parse = marked;
        }
    } else {
        console.error("Marked.js library not loaded! Please check your script tags.");
        // Create a fallback for marked if it's not available
        window.marked = {
            parse: function(text) {
                // Simple fallback to render text as HTML
                return text.replace(/\n/g, '<br>');
            }
        };
    }

    function safeStringify(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, function(key, value) {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return; // Omit circular reference
            }
            seen.add(value);
          }
          return value;
        });
      }

      function createMarkedFallback() {
        if (typeof window.marked === 'undefined') {
          console.warn("Marked.js not found, using fallback implementation");
          window.marked = {
            parse: function(text) {
              // Very simple markdown to HTML conversion as a fallback
              return text
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/# (.+)$/gm, '<h1>$1</h1>')
                .replace(/## (.+)$/gm, '<h2>$1</h2>')
                .replace(/### (.+)$/gm, '<h3>$1</h3>');
            }
          };
        } else if (typeof window.marked === 'function' && typeof window.marked.parse === 'undefined') {
          // If marked is a function but doesn't have a parse method
          console.log("Adding parse method to marked function");
          window.marked.parse = window.marked;
        }
      }

    // Export to Word function with dynamic filename (filename passed in)
// Additional helper function to help with the Word export
function cleanupMarkdownForExport() {
    const analysisResults = document.getElementById('analysis-results');
    if (!analysisResults) return;
    
    // Add proper spacing for lists and headers if they're missing
    const content = analysisResults.innerHTML;
    
    // Fix list spacing issues
    const fixedLists = content
      .replace(/<li>/g, '<li style="margin-bottom: 8px;">')
      .replace(/<ul>/g, '<ul style="margin-bottom: 16px; margin-top: 8px; padding-left: 30px;">')
      .replace(/<ol>/g, '<ol style="margin-bottom: 16px; margin-top: 8px; padding-left: 30px;">');
      
    // Fix header spacing
    const fixedHeaders = fixedLists
      .replace(/<h1>/g, '<h1 style="margin-top: 24px; margin-bottom: 16px;">')
      .replace(/<h2>/g, '<h2 style="margin-top: 20px; margin-bottom: 12px;">')
      .replace(/<h3>/g, '<h3 style="margin-top: 16px; margin-bottom: 8px;">');
      
    // Fix paragraph spacing
    const fixedParagraphs = fixedHeaders
      .replace(/<p>/g, '<p style="margin-bottom: 16px;">');
      
    analysisResults.innerHTML = fixedParagraphs;
  }
  
  // Updated export to Word function
  function exportToWord(elementId, filename) {
    // Get the content element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Element not found:", elementId);
      return;
    }
    
    // Create a clone to modify without affecting the original
    const contentClone = element.cloneNode(true);
    
    // Apply additional formatting for Word
    const paragraphs = contentClone.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.marginBottom = '10pt';
      p.style.lineHeight = '1.5';
    });
    
    const headers = contentClone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach(h => {
      h.style.marginTop = '12pt';
      h.style.marginBottom = '6pt';
      if (h.tagName === 'H1') h.style.fontSize = '16pt';
      if (h.tagName === 'H2') h.style.fontSize = '14pt';
      if (h.tagName === 'H3') h.style.fontSize = '12pt';
    });
    
    const lists = contentClone.querySelectorAll('ul, ol');
    lists.forEach(list => {
      list.style.marginBottom = '10pt';
      list.style.paddingLeft = '30pt';
    });
    
    const listItems = contentClone.querySelectorAll('li');
    listItems.forEach(item => {
      item.style.marginBottom = '5pt';
    });
    
    // Create the Word document HTML
    var preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
                  <head>
                  <meta charset='utf-8'>
                  <title>Export to Word</title>
                  <style>
                    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
                    h1 { font-size: 16pt; margin-top: 16pt; margin-bottom: 8pt; }
                    h2 { font-size: 14pt; margin-top: 14pt; margin-bottom: 7pt; }
                    h3 { font-size: 12pt; margin-top: 12pt; margin-bottom: 6pt; }
                    p { margin-bottom: 10pt; }
                    ul, ol { margin-bottom: 10pt; padding-left: 30pt; }
                    li { margin-bottom: 5pt; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 10pt; }
                    th, td { border: 1px solid #ddd; padding: 8pt; }
                    th { background-color: #f2f2f2; }
                    .section { margin-top: 12pt; margin-bottom: 12pt; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                  </style>
                  </head><body>`;
    var postHtml = "</body></html>";
    
    var html = preHtml + contentClone.innerHTML + postHtml;
    
    // Create and download the Word document
    var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    document.body.appendChild(link);
    link.href = url;
    link.download = filename;
    link.click();
    document.body.removeChild(link);
  }
  

  function streamAIResponse(apiKey, messageContent) {
    return new Promise((resolve, reject) => {
      const analysisResults = document.getElementById('analysis-results');
      analysisResults.innerHTML = ""; // Clear previous content
      
      // Create a container for properly formatted content
      const formattedContainer = document.createElement('div');
      formattedContainer.className = 'formatted-analysis';
      analysisResults.appendChild(formattedContainer);
      
      // Keep track of the complete markdown content
      let completeMarkdown = '';
      
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          stream: true,
          messages: [
            { 
              role: "system", 
              content: "You are a disaster and health data analyst. Format your responses using proper markdown. Use double line breaks between paragraphs. Use headings with # symbols. Use bullet points with - or * symbols. Use numbered lists with 1., 2., etc. Make sure all markdown is properly formatted." 
            },
            { role: "user", content: messageContent }
          ]
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        
        function processStream() {
          return reader.read().then(({ done, value }) => {
            if (done) {
              // When the stream is complete, process the entire markdown content
              try {
                // Process the complete markdown content
                const processedMarkdown = preprocessMarkdown(completeMarkdown);
                
                // For the final rendering, use showdown instead of marked for better results
                const converter = new showdown.Converter({
                  tables: true,
                  simpleLineBreaks: true,
                  strikethrough: true,
                  tasklists: true
                });
                
                const html = converter.makeHtml(processedMarkdown);
                formattedContainer.innerHTML = html;
                
                // Apply additional formatting CSS classes
                applyFormattingClasses(formattedContainer);
              } catch (e) {
                console.error("Error rendering final markdown:", e);
                // Fallback to simpler HTML if showdown fails
                formattedContainer.innerHTML = simpleMarkdownToHtml(completeMarkdown);
              }
              
              resolve();
              return;
            }
            
            const chunk = decoder.decode(value);
            buffer += chunk;
            
            try {
              // Process SSE format
              const lines = buffer.split('\n');
              let processedIndex = 0;
              let newContent = '';
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.startsWith('data: ')) {
                  const data = line.substring(6); // Remove 'data: ' prefix
                  
                  if (data === '[DONE]') {
                    processedIndex = i + 1;
                    continue;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                      newContent += parsed.choices[0].delta.content;
                      processedIndex = i + 1;
                    }
                  } catch (e) {
                    // This might be an incomplete JSON, which is fine in a stream
                  }
                }
              }
              
              // Update buffer to contain only unprocessed content
              if (processedIndex > 0) {
                buffer = lines.slice(processedIndex).join('\n');
              }
              
              if (newContent) {
                // Add new content to our complete markdown
                completeMarkdown += newContent;
                
                // For the live streaming display, use a simpler rendering
                // This will be replaced with better rendering when streaming is complete
                formattedContainer.innerHTML = simpleMarkdownToHtml(completeMarkdown);
                
                // Scroll to the bottom
                analysisResults.scrollTop = analysisResults.scrollHeight;
              }
            } catch (e) {
              console.error('Error processing stream chunk:', e);
            }
            
            return processStream();
          });
        }
        
        return processStream();
      })
      .catch(error => {
        console.error('Streaming error:', error);
        formattedContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        reject(error);
      });
    });
  }

  // Function to preprocess markdown for better rendering
function preprocessMarkdown(markdown) {
    // Step 1: Clean up excessive whitespace
    let processed = markdown
      .replace(/\r\n/g, '\n')          // Normalize line endings
      .replace(/[ \t]+\n/g, '\n')      // Remove trailing whitespace
      .replace(/\n[ \t]+/g, '\n')      // Remove leading whitespace
      .replace(/[ \t]{2,}/g, ' ')      // Convert multiple spaces to single space
      .replace(/\n{3,}/g, '\n\n');     // Limit consecutive line breaks to maximum 2
    
    // Step 2: Fix markdown formatting issues
    
    // Fix headers (ensure space after #)
    processed = processed.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');
    
    // Fix list items (ensure space after - or *)
    processed = processed.replace(/^([\*\-])([^\s])/gm, '$1 $2');
    
    // Fix numbered lists (ensure space after number)
    processed = processed.replace(/^(\d+\.)([^\s])/gm, '$1 $2');
    
    // Ensure paragraphs are separated by double line breaks
    processed = processed.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');
    
    // Step 3: Add additional formatting for specific elements
    
    // Add horizontal lines before major sections
    processed = processed.replace(/\n(#{1,2} )/g, '\n\n---\n\n$1');
    
    return processed;
  }
  
  // A simple function to convert markdown to HTML without external libraries
  function simpleMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    // Basic markdown to HTML conversion
    return markdown
      // Headers
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Lists
      .replace(/^\s*\- (.*$)/gm, '<li>$1</li>')
      .replace(/^\s*\* (.*$)/gm, '<li>$1</li>')
      .replace(/^\s*\d+\. (.*$)/gm, '<li>$1</li>')
      
      // Code blocks and inline code
      .replace(/`{3}([\s\S]*?)`{3}/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      
      // Line breaks and paragraphs
      .replace(/\n\s*\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      
      // Wrap with paragraph tags
      .replace(/^(.+)$/gm, function(match) {
        if (match.startsWith('<h') || match.startsWith('<li') || 
            match.startsWith('<pre') || match.startsWith('</p><p>')) {
          return match;
        }
        return '<p>' + match + '</p>';
      })
      
      // Fix nested paragraph tags
      .replace(/<p><\/p>/g, '')
      .replace(/<p><p>/g, '<p>')
      .replace(/<\/p><\/p>/g, '</p>');
  }
  
  // Apply additional CSS classes to elements for better formatting
  function applyFormattingClasses(container) {
    // Add classes to headers
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
      header.classList.add('analysis-header');
    });
    
    // Add classes to lists
    container.querySelectorAll('ul, ol').forEach(list => {
      list.classList.add('analysis-list');
    });
    
    // Add classes to list items
    container.querySelectorAll('li').forEach(item => {
      item.classList.add('analysis-list-item');
    });
    
    // Add classes to paragraphs
    container.querySelectorAll('p').forEach(paragraph => {
      paragraph.classList.add('analysis-paragraph');
    });
    
    // Add classes to code blocks
    container.querySelectorAll('pre, code').forEach(code => {
      code.classList.add('analysis-code');
    });
  }
    

    // Initialize Materialize components
    M.AutoInit();

    // Add map legend after map is initialized
    setTimeout(addMapLegend, 1000);
    
    // Initialize datepickers
    const datepickers = document.querySelectorAll('.datepicker');
    M.Datepicker.init(datepickers, {
        format: 'yyyy-mm-dd',
        defaultDate: new Date(),
        setDefaultDate: true
    });
    
    // Initialize the map - center on Sierra Leone instead of the default [0,0]
    const map = L.map('map-container').setView([8.5, -13.0], 7);
    
    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Use marker clustering for facilities
    const facilitiesLayer = L.markerClusterGroup({
        disableClusteringAtZoom: 15,
        showCoverageOnHover: false
    });
    map.addLayer(facilitiesLayer);
    window.facilityMarkers = [];
    
    // Disaster data layer group
    const disasterLayer = L.layerGroup().addTo(map);
    
    // Check debug settings flag
    const showDebugMarkers = localStorage.getItem('showDebugMarkers') === 'true';
    
    // Set dark mode based on local storage or default to false
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
    }
    
    // Save dark mode preference
    document.getElementById('dark-mode-toggle').addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
    });
    
    // Save settings
    document.getElementById('save-settings').addEventListener('click', function() {
        const gdacRssUrl = document.getElementById('gdac-rss-url').value;
        const dhis2ApiUrl = document.getElementById('dhis2-api-url').value;
        const bufferRadius = document.getElementById('buffer-radius').value;
        const corsProxyUrl = document.getElementById('cors-proxy-url').value;
        
        localStorage.setItem('gdacRssUrl', gdacRssUrl);
        localStorage.setItem('dhis2ApiUrl', dhis2ApiUrl);
        localStorage.setItem('bufferRadius', bufferRadius);
        localStorage.setItem('corsProxyUrl', corsProxyUrl);
        
        M.toast({html: 'Settings saved!', classes: 'rounded'});
        
        // Reload data with new settings
        loadGdacData();
        loadDhis2Facilities();
    });
    
    // Load settings from localStorage with defaults
    document.getElementById('gdac-rss-url').value = localStorage.getItem('gdacRssUrl') || 'https://www.gdacs.org/xml/rss.xml';
    document.getElementById('dhis2-api-url').value = localStorage.getItem('dhis2ApiUrl') || '';
    document.getElementById('buffer-radius').value = localStorage.getItem('bufferRadius') || '50';
    document.getElementById('cors-proxy-url').value = localStorage.getItem('corsProxyUrl') || 'https://corsproxy.io/?';
    document.getElementById('openai-api-key').value = localStorage.getItem('openaiApiKey') || '';
    
    // Toggle facilities layer - ensure checkbox is checked initially
    const facilitiesToggle = document.getElementById('toggle-facilities');
    facilitiesToggle.checked = true;
    
    facilitiesToggle.addEventListener('change', function(e) {
        if (e.target.checked) {
            map.addLayer(facilitiesLayer);
        } else {
            map.removeLayer(facilitiesLayer);
        }
    });
    
    // Apply filters
    document.getElementById('apply-filters').addEventListener('click', function() {
        loadGdacData();
        loadDhis2Facilities();
    });
    
    // Reset filters
    document.getElementById('reset-filters').addEventListener('click', function() {
        document.getElementById('disaster-type-filter').value = '';
        document.getElementById('severity-filter').value = '';
        document.getElementById('facility-type-filter').value = '';
        
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 1);
        
        M.Datepicker.getInstance(document.getElementById('date-from')).setDate(fromDate);
        M.Datepicker.getInstance(document.getElementById('date-to')).setDate(new Date());
        
        M.FormSelect.init(document.querySelectorAll('select'));
        
        loadGdacData();
        loadDhis2Facilities();
    });
    
    // Switch to use static data
    document.getElementById('use-static-data').addEventListener('change', function(e) {
        localStorage.setItem('useStaticData', e.target.checked);
        loadGdacData();
    });
    
    // Run AI analysis for disaster events
    document.getElementById('run-analysis').addEventListener('click', function() {
        const runBtn = this;
        if (runBtn.disabled) return;
        runBtn.disabled = true;
      
        const apiKey = document.getElementById('openai-api-key').value;
        let query = document.getElementById('analysis-query').value.trim();
      
        if (!apiKey) {
          M.toast({html: 'Please enter your OpenAI API key', classes: 'rounded red'});
          runBtn.disabled = false;
          return;
        }
      
        if (!query) {
          M.toast({html: 'Please enter a question for analysis', classes: 'rounded red'});
          runBtn.disabled = false;
          return;
        }
      
        localStorage.setItem('openaiApiKey', apiKey);
        document.querySelector('.ai-loading').classList.remove('hide');
      
        // Retrieve the selected disaster.
        const disaster = window.currentDisaster;
        if (!disaster) {
          M.toast({html: 'Please select a disaster first.', classes: 'rounded red'});
          runBtn.disabled = false;
          document.querySelector('.ai-loading').classList.add('hide');
          return;
        }
      
        let allFacilityData = [];
        try {
          allFacilityData = getFilteredFacilityData ? getFilteredFacilityData() : window.facilityData || [];
        } catch (e) {
          console.error("Error getting facility data:", e);
        }
      
        const radiusInKm = parseInt(localStorage.getItem('bufferRadius') || '50');
        let facilitiesWithinRadius = [];
      
        console.log(`Filtering facilities within ${radiusInKm}km for disaster: ${disaster.title}`);
        allFacilityData.forEach(facility => {
          if (!facility.lat || !facility.lng) {
            console.warn("Facility missing coordinates:", facility.name);
            return;
          }
          const distance = calculateDistance(disaster.lat, disaster.lng, facility.lat, facility.lng);
          console.log(`${facility.name}: distance ${distance.toFixed(2)} km`);
          if (distance <= radiusInKm) {
            facilitiesWithinRadius.push({
              ...facility,
              distance: Math.round(distance * 10) / 10,
              disasterName: disaster.title
            });
          }
        });
      
        console.log(`Found ${facilitiesWithinRadius.length} facilities within ${radiusInKm}km of disaster: ${disaster.title}`);
      
        const messageContent = `Analyze the following disaster and health facility data and respond to this query using proper markdown formatting: ${query}
      
      Disaster data: ${safeStringify(disaster)}
      
      Facility data (filtered to only include facilities within ${radiusInKm}km of the disaster): ${safeStringify(facilitiesWithinRadius)}
      
      Important analysis instructions:
      1. Only consider facilities that are actually within ${radiusInKm}km of the disaster.
      2. If no facilities are within the specified radius, clearly state this fact.
      3. Provide accurate analysis based on the geographical relationship between facilities and the disaster.
      4. Include the actual distances between facilities and the disaster when relevant.
      5. Do not mention facilities that are not within the specified radius.`;
      
        streamAIResponse(apiKey, messageContent)
          .then(() => {
            document.querySelector('.ai-loading').classList.add('hide');
            document.getElementById('export-word').disabled = false;
            runBtn.disabled = false;
            if (!window.currentDisasterTitle) {
              window.currentDisasterTitle = disaster.title || "Selected_Disaster_AI_Analysis";
            }
          })
          .catch(error => {
            document.querySelector('.ai-loading').classList.add('hide');
            console.error('Error:', error);
            M.toast({html: 'Error processing AI analysis. Check your API key and try again.', classes: 'rounded red'});
            runBtn.disabled = false;
          });
      });
    
    // Update the export-word event handler
    document.getElementById('export-word').addEventListener('click', function(e) {
        let filename = window.currentDisasterTitle ? 
        `Disaster - ${window.currentDisasterTitle}_AI_Analysis.doc` : 
        'General_AI_Analysis.doc';
        exportToWord('analysis-results', filename);
    });
    
    // Export to Word event for facility analysis results (facility modal)
    document.getElementById('export-facility-word').addEventListener('click', function(e) {
        let filename = window.currentFacilityTitle ? 
            `${window.currentFacilityTitle}_Facility_AI_Analysis.doc` : 
            'Facility_AI_Analysis.doc';
        exportToWord('facility-details-content', filename);
    });
    
    // Function to load GDAC RSS feed data
    function loadGdacData() {
        disasterLayer.clearLayers();
        M.toast({html: 'Loading disaster data...', classes: 'rounded blue'});
        const useStaticData = localStorage.getItem('useStaticData') === 'true';
        if (useStaticData) { processStaticGdacData(); }
        else { fetchLiveGdacData(); }
    }
    
    function fetchLiveGdacData() {
        const gdacRssUrl = localStorage.getItem('gdacRssUrl') || 'https://www.gdacs.org/xml/rss.xml';
        const corsProxyUrl = localStorage.getItem('corsProxyUrl') || 'https://corsproxy.io/?';
        const corsProxies = [corsProxyUrl, 'https://api.allorigins.win/raw?url=', 'https://api.codetabs.com/v1/proxy?quest='];
        
        tryNextProxy(0);
        function tryNextProxy(index) {
            if (index >= corsProxies.length) {
                M.toast({html: 'Failed to load GDAC data. Switching to sample data.', classes: 'rounded red'});
                processStaticGdacData();
                return;
            }
            const proxyUrl = corsProxies[index];
            fetch(proxyUrl + encodeURIComponent(gdacRssUrl))
                .then(response => {
                    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                    return response.text();
                })
                .then(data => { processGdacData(data); })
                .catch(error => { tryNextProxy(index + 1); });
        }
    }
    
    function processGdacData(xmlData) {
        try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlData, 'application/xml');
            if (xml.querySelector('parsererror')) { throw new Error('Invalid XML'); }
            const items = xml.querySelectorAll('item');
            if (items.length === 0) { processStaticGdacData(); return; }
            processXmlItems(items);
        } catch (error) {
            M.toast({html: 'Error parsing GDAC data. Using sample data instead.', classes: 'rounded orange'});
            processStaticGdacData();
        }
    }
    
    function processXmlItems(items) {
        const typeFilter = document.getElementById('disaster-type-filter').value;
        const severityFilter = document.getElementById('severity-filter').value;
        const fromDate = M.Datepicker.getInstance(document.getElementById('date-from')).date;
        const toDate = M.Datepicker.getInstance(document.getElementById('date-to')).date;
        const tableBody = document.getElementById('disaster-table-body');
        tableBody.innerHTML = '';
        const disasterData = [];
        let processedCount = 0;
        
        function safeExtract(item, selector) {
            if (selector.includes(':')) {
                try { const element = item.querySelector(selector.replace(':', '\\:')); if (element) return element.textContent; } catch (e) {}
                try { const elements = item.getElementsByTagName(selector); if (elements && elements.length > 0) return elements[0].textContent; } catch (e) {}
                try { const localName = selector.split(':')[1]; const elements = item.getElementsByTagName(localName); if (elements && elements.length > 0) return elements[0].textContent; } catch (e) {}
                return '';
            }
            try { const element = item.querySelector(selector); return element ? element.textContent : ''; } catch (e) { return ''; }
        }
        
        Array.from(items).forEach(item => {
            const title = safeExtract(item, 'title');
            const link = safeExtract(item, 'link');
            const description = safeExtract(item, 'description');
            const pubDate = safeExtract(item, 'pubDate');
            let lat = null, lng = null;
            const geoPoint = safeExtract(item, 'georss:point');
            if (geoPoint) { const coords = geoPoint.split(' ').map(parseFloat); if (coords.length === 2) { [lat, lng] = coords; } }
            if (!lat || !lng) {
                const geoLat = safeExtract(item, 'geo:lat');
                const geoLong = safeExtract(item, 'geo:long');
                if (geoLat && geoLong) { lat = parseFloat(geoLat); lng = parseFloat(geoLong); }
            }
            if (!lat || !lng) return;
            
            let disasterType = safeExtract(item, 'gdacs:eventtype');
            if (!disasterType) {
                const typeMatch = title.match(/\b(EQ|FL|TC|DR|VO|TS|WF)\b/);
                disasterType = typeMatch ? typeMatch[0] : 'Unknown';
            }
            
            let severity = safeExtract(item, 'gdacs:alertlevel');
            if (!severity) {
                const severityMatch = title.match(/\b(Green|Orange|Red)\b/);
                severity = severityMatch ? severityMatch[0] : 'Unknown';
            }
            
            if (typeFilter && disasterType !== typeFilter) return;
            if (severityFilter && severity !== severityFilter) return;
            const itemDate = new Date(pubDate);
            if (fromDate && itemDate < fromDate) return;
            if (toDate && itemDate > toDate) return;
            
            const eventId = safeExtract(item, 'gdacs:eventid');
            const episodeId = safeExtract(item, 'gdacs:episodeid');
            const country = safeExtract(item, 'gdacs:country');
            const population = safeExtract(item, 'gdacs:population');
            const eventName = safeExtract(item, 'gdacs:eventname');
            
            const disaster = { title, link, description, pubDate, lat, lng, type: disasterType, severity, date: itemDate, eventId, episodeId, country, population, eventName };
            disasterData.push(disaster);
            processedCount++;
            addDisasterToMap(disaster);
            addDisasterToTable(disaster);
        });
        
        window.disasterData = disasterData;
        M.toast({html: `Loaded ${processedCount} disaster events`, classes: 'rounded green'});
        if (processedCount === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="center-align">No disaster events match your filters</td></tr>';
        }
        if (processedCount > 0) { fitMapToDisasters(); }
    }
    
    function processStaticGdacData() {
        const sampleDisasters = [
            {
                title: "EQ 6.2 M - Indonesia (Sulawesi) - 14 Jan 2025 15:29 UTC - Red",
                link: "https://www.gdacs.org/report.aspx?eventid=1234567",
                description: "A 6.2M earthquake occurred in Sulawesi, Indonesia on 14 Jan 2025 15:29 UTC.",
                pubDate: "Mon, 14 Jan 2025 16:45:11 UTC",
                lat: -2.6322,
                lng: 118.8947,
                type: "EQ",
                severity: "Red",
                date: new Date("2025-01-14T16:45:11Z")
            },
            {
                title: "TC THIRTY - Vanuatu - 28 Feb 2025 03:22 UTC - Orange",
                link: "https://www.gdacs.org/report.aspx?eventid=1234568",
                description: "Tropical Cyclone THIRTY formed over the South Pacific Ocean on 28 Feb 2025.",
                pubDate: "Mon, 28 Feb 2025 05:12:33 UTC",
                lat: -17.4275,
                lng: 168.3219,
                type: "TC",
                severity: "Orange",
                date: new Date("2025-02-28T05:12:33Z")
            },
            {
                title: "FL - Tanzania - 5 Mar 2025 12:15 UTC - Orange",
                link: "https://www.gdacs.org/report.aspx?eventid=1234569",
                description: "Heavy rainfall has caused significant flooding in central Tanzania.",
                pubDate: "Thu, 05 Mar 2025 14:30:00 UTC",
                lat: -6.3690,
                lng: 34.8888,
                type: "FL",
                severity: "Orange",
                date: new Date("2025-03-05T14:30:00Z")
            },
            {
                title: "VO - Iceland - 8 Feb 2025 08:45 UTC - Green",
                link: "https://www.gdacs.org/report.aspx?eventid=1234570",
                description: "Volcanic activity reported in southern Iceland.",
                pubDate: "Thu, 08 Feb 2025 09:30:00 UTC",
                lat: 63.6321,
                lng: -19.6012,
                type: "VO",
                severity: "Green",
                date: new Date("2025-02-08T09:30:00Z")
            },
            {
                title: "DR - Ethiopia - 2 Mar 2025 00:00 UTC - Red",
                link: "https://www.gdacs.org/report.aspx?eventid=1234571",
                description: "Severe drought conditions persist in eastern Ethiopia.",
                pubDate: "Mon, 02 Mar 2025 10:15:00 UTC",
                lat: 9.1450,
                lng: 40.4897,
                type: "DR",
                severity: "Red",
                date: new Date("2025-03-02T10:15:00Z")
            }
        ];
        
        const tableBody = document.getElementById('disaster-table-body');
        tableBody.innerHTML = '';
        let processedCount = 0;
        window.disasterData = [];
        const typeFilter = document.getElementById('disaster-type-filter').value;
        const severityFilter = document.getElementById('severity-filter').value;
        const fromDate = M.Datepicker.getInstance(document.getElementById('date-from')).date;
        const toDate = M.Datepicker.getInstance(document.getElementById('date-to')).date;
        
        sampleDisasters.forEach(disaster => {
            if (typeFilter && disaster.type !== typeFilter) return;
            if (severityFilter && disaster.severity !== severityFilter) return;
            if (fromDate && disaster.date < fromDate) return;
            if (toDate && disaster.date > toDate) return;
            window.disasterData.push(disaster);
            processedCount++;
            addDisasterToMap(disaster);
            addDisasterToTable(disaster);
        });
        
        M.toast({html: `Loaded ${processedCount} sample disaster events`, classes: 'rounded blue'});
        if (processedCount === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="center-align">No disaster events match your filters</td></tr>';
        }
        if (processedCount > 0) { fitMapToDisasters(); }
    }
    
    function fitMapToDisasters() {
        const markers = [];
        disasterLayer.eachLayer(layer => { if (layer.getLatLng) { markers.push(layer.getLatLng()); } });
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }
    
    // Function to load DHIS2 facilities using the JSON endpoint (geometry field)
    function loadDhis2Facilities() {
        const dhis2ApiUrl = localStorage.getItem('dhis2ApiUrl');
        if (!dhis2ApiUrl) {
            M.toast({html: 'Please set DHIS2 API URL in settings', classes: 'rounded orange'});
            return;
        }
        facilitiesLayer.clearLayers();
        window.facilityMarkers = [];
        M.toast({html: 'Loading DHIS2 facilities...', classes: 'rounded blue'});
        
        let baseApiUrl = dhis2ApiUrl.replace(/\/+$/, '');
        baseApiUrl = baseApiUrl.replace("http://", "https://");
        if (!baseApiUrl.endsWith('/api')) { baseApiUrl += '/api'; }
        
        const orgUnitsUrl = `${baseApiUrl}/organisationUnits.json?fields=id,name,geometry,featureType,parent[name],organisationUnitGroups[name]&pageSize=1000`;
        const dhis2Username = localStorage.getItem('dhis2Username');
        const dhis2Password = localStorage.getItem('dhis2Password');
        const fetchOptions = { credentials: 'include', headers: {} };
        
        if (dhis2Username && dhis2Password) {
            const authHeader = 'Basic ' + btoa(`${dhis2Username}:${dhis2Password}`);
            fetchOptions.headers['Authorization'] = authHeader;
        }
        
        fetch(orgUnitsUrl, fetchOptions)
        .then(response => { if (!response.ok) { throw new Error(`DHIS2 API error: ${response.status}`); } return response.json(); })
        .then(data => {
            if (!data.organisationUnits || data.organisationUnits.length === 0) { throw new Error("No organisation units returned"); }
            
            const facilityTypeFilter = document.getElementById('facility-type-filter').value;
            const facilityTypes = new Set();
            const facilities = [];
            let successCount = 0, errorCount = 0, noCoordinatesCount = 0;
            
            if (showDebugMarkers) {
                const directTestMarker = L.marker([9.0131, -12.9487], { title: "Direct Test Marker" }).addTo(map);
                directTestMarker.bindPopup("This is a direct test marker").openPopup();
            }
            
            data.organisationUnits.forEach(unit => {
                let lat = null, lng = null;
                let parsed = false;
                
                if (unit.geometry && unit.geometry.coordinates && Array.isArray(unit.geometry.coordinates) && unit.geometry.coordinates.length === 2) {
                    const coords = unit.geometry.coordinates;
                    lng = parseFloat(coords[0]);
                    lat = parseFloat(coords[1]);
                    parsed = true;
                }
                
                if (!parsed && unit.coordinates) {
                    try {
                        const coords = JSON.parse(unit.coordinates);
                        if (Array.isArray(coords) && coords.length === 2) {
                            lng = parseFloat(coords[0]);
                            lat = parseFloat(coords[1]);
                            parsed = true;
                        }
                    } catch (e) {}
                    if (!parsed) {
                        try {
                            const coordsStr = unit.coordinates.replace(/[\[\]]/g, '');
                            const coordsArr = coordsStr.split(',').map(c => parseFloat(c.trim()));
                            if (coordsArr.length === 2) {
                                lng = coordsArr[0];
                                lat = coordsArr[1];
                                parsed = true;
                            }
                        } catch (e) {}
                    }
                }
                
                if (!parsed) { noCoordinatesCount++; return; }
                if (isValidCoordinate(lat, lng)) {
                    let facilityType = 'Unknown';
                    if (unit.organisationUnitGroups && unit.organisationUnitGroups.length > 0) {
                        facilityType = unit.organisationUnitGroups[0].name;
                        facilityTypes.add(facilityType);
                    }
                    if (facilityTypeFilter && facilityType !== facilityTypeFilter) return;
                    
                    const facility = { id: unit.id, name: unit.name, lat, lng, type: facilityType, parent: unit.parent ? unit.parent.name : 'Unknown' };
                    facilities.push(facility);
                    const marker = addFacilityToMap(facility);
                    successCount++;
                } else { errorCount++; }
            });
            
            const facilityTypeSelect = document.getElementById('facility-type-filter');
            facilityTypeSelect.innerHTML = '<option value="" selected>All Facility Types</option>';
            Array.from(facilityTypes).sort().forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                facilityTypeSelect.appendChild(option);
            });
            M.FormSelect.init(facilityTypeSelect);
            
            window.facilityData = facilities;
            
            map.addLayer(facilitiesLayer);
            document.getElementById('toggle-facilities').checked = true;
            
            M.toast({html: `Loaded ${successCount} facilities (${errorCount} with invalid coordinates, ${noCoordinatesCount} without coordinates)`, classes: 'rounded green'});
            
            if (successCount === 0) { addTestFacility(); M.toast({html: 'No valid facilities found, added a test facility', classes: 'rounded orange'}); }
            if (successCount > 0) { fitMapToFacilities(); }
        })
        .catch(error => { M.toast({html: `Error loading facilities: ${error.message}. Added test facility instead.`, classes: 'rounded red'}); addTestFacility(); });
    }
    
    function fitMapToFacilities() {
        const markers = [];
        facilitiesLayer.eachLayer(layer => { if (layer.getLatLng) { markers.push(layer.getLatLng()); } });
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }
    
    function isValidCoordinate(lat, lng) {
        if (isNaN(lat) || isNaN(lng)) return false;
        if (lat < -90 || lat > 90) return false;
        if (lng < -180 || lng > 180) return false;
        return true;
    }
    
    // Function to add a test facility (fallback)
    function addTestFacility() {
        facilitiesLayer.clearLayers();
        window.facilityMarkers = [];
        const testFacility = { id: 'testFacility1', name: 'Fabu Community Health Post', lat: -6.3690, lng: 34.8888, type: 'Community Health Post', parent: 'Central Region' };
        addFacilityToMap(testFacility);
        window.facilityData = [testFacility];
        
        const facilityTypeSelect = document.getElementById('facility-type-filter');
        facilityTypeSelect.innerHTML = '<option value="" selected>All Facility Types</option>';
        const option = document.createElement('option');
        option.value = 'Community Health Post';
        option.textContent = 'Community Health Post';
        facilityTypeSelect.appendChild(option);
        M.FormSelect.init(facilityTypeSelect);
        
        map.setView([testFacility.lat, testFacility.lng], 10);
    }
    
    // Function to add facility to map with enhanced popup
    function addFacilityToMap(facility) {
        const facilityIcon = L.divIcon({
            html: '<span class="material-icons facility-marker">local_hospital</span>',
            className: 'facility-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        const marker = L.marker([facility.lat, facility.lng], { icon: facilityIcon, title: facility.name });
        marker.bindPopup(`
            <h5>${facility.name}</h5>
            <p><strong>Type:</strong> ${facility.type}</p>
            <p><strong>Administrative Area:</strong> ${facility.parent}</p>
            <p><strong>ID:</strong> ${facility.id}</p>
            <p><strong>Coordinates:</strong> ${facility.lat}, ${facility.lng}</p>
        `);
        marker.on('click', function() { showFacilityDetails(facility); });
        facilitiesLayer.addLayer(marker);
        window.facilityMarkers.push(marker);
        marker.facilityData = facility;
        return marker;
    }
    
    // Function to show facility details in a modal with AI analysis option
    function showFacilityDetails(facility) {
        const modal = document.getElementById('facility-details-modal');
        const titleElem = document.getElementById('facility-details-title');
        const contentElem = document.getElementById('facility-details-content');
        
        titleElem.textContent = facility.name;
        contentElem.innerHTML = `
            <p><strong>Type:</strong> ${facility.type}</p>
            <p><strong>Administrative Area:</strong> ${facility.parent}</p>
            <p><strong>ID:</strong> ${facility.id}</p>
            <p><strong>Coordinates:</strong> ${facility.lat}, ${facility.lng}</p>
            <button id="analyze-facility-btn" class="btn blue">Analyze Facility with AI</button>
        `;
        
        // Disable export button by default until analysis is complete
        document.getElementById('export-facility-word').disabled = true;
        
        // Set current facility title for dynamic filename
        window.currentFacilityTitle = facility.name;
        
        document.getElementById('analyze-facility-btn').onclick = function() { analyzeFacilityData(facility); };
        M.Modal.getInstance(modal).open();
    }
    
    // Function to analyze facility data using AI
    function analyzeFacilityData(facility) {
        const apiKey = localStorage.getItem('openaiApiKey');
        if (!apiKey) {
            M.toast({html: 'Please enter your OpenAI API key', classes: 'rounded red'});
            return;
        }
        
        const analyzeBtn = document.getElementById('analyze-facility-btn');
        if (analyzeBtn) analyzeBtn.disabled = true;
        document.querySelector('.ai-loading').classList.remove('hide');
        
        // Set current facility title for filename
        window.currentFacilityTitle = facility.name;
        
        const prompt = `Analyze the health facility "${facility.name}" (Type: ${facility.type}, located in ${facility.parent}). What are the key factors for resource allocation and risk assessment?`;
        
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: "You are a disaster and health data analyst." },
                    { role: "user", content: prompt }
                ]
            })
        })
        .then(response => response.json())
        .then(data => {
            document.querySelector('.ai-loading').classList.add('hide');
            const analysisResults = data.choices[0].message.content;
            const contentElem = document.getElementById('facility-details-content');
            contentElem.innerHTML += `<h6>AI Analysis:</h6><p>${analysisResults.replace(/\n/g, '<br>')}</p>`;
            if (analyzeBtn) analyzeBtn.disabled = false;
            // Enable export button after analysis is complete
            document.getElementById('export-facility-word').disabled = false;
        })
        .catch(error => {
            document.querySelector('.ai-loading').classList.add('hide');
            console.error('Error during AI analysis:', error);
            M.toast({html: 'Error processing AI analysis. Check your API key and try again.', classes: 'rounded red'});
            if (analyzeBtn) analyzeBtn.disabled = false;
        });
    }
    
    // Function to add disaster to map
    function addDisasterToMap(disaster) {
        let icon, markerClass;
        switch(disaster.type) {
            case 'EQ': icon = 'flash_on'; markerClass = 'earthquake-marker'; break;
            case 'FL': icon = 'waves'; markerClass = 'flood-marker'; break;
            case 'TC': icon = 'rotate_right'; markerClass = 'cyclone-marker'; break;
            case 'DR': icon = 'terrain'; markerClass = 'drought-marker'; break;
            case 'VO': icon = 'local_fire_department'; markerClass = 'volcano-marker'; break;
            case 'TS': icon = 'water'; markerClass = 'tsunami-marker'; break;
            case 'WF': icon = 'whatshot'; markerClass = 'wildfire-marker'; break;
            default: icon = 'warning'; markerClass = 'other-marker';
        }
        
        const disasterIcon = L.divIcon({
            html: `<span class="material-icons ${markerClass}">${icon}</span>`,
            className: `disaster-marker severity-${disaster.severity}`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const marker = L.marker([disaster.lat, disaster.lng], { icon: disasterIcon, title: disaster.title }).addTo(disasterLayer);
        const radius = parseInt(localStorage.getItem('bufferRadius') || '50') * 1000;
        let impactColor;
        switch(disaster.severity) {
            case 'Red': impactColor = '#f44336'; break;
            case 'Orange': impactColor = '#ff9800'; break;
            case 'Green': impactColor = '#4caf50'; break;
            default: impactColor = '#2196F3';
        }
        
        L.circle([disaster.lat, disaster.lng], { radius, color: impactColor, fillColor: impactColor, fillOpacity: 0.1, weight: 1 }).addTo(disasterLayer);
        
        marker.bindPopup(`
            <h5>${disaster.title}</h5>
            <p><strong>Date:</strong> ${new Date(disaster.pubDate).toLocaleString()}</p>
            <p><strong>Type:</strong> ${getDisasterTypeName(disaster.type)}</p>
            <p><strong>Severity:</strong> <span class="severity-${disaster.severity}">${disaster.severity}</span></p>
            ${disaster.country ? `<p><strong>Affected Countries:</strong> ${disaster.country}</p>` : ''}
            ${disaster.population ? `<p><strong>Population Impact:</strong> ${disaster.population}</p>` : ''}
            <p>${disaster.description}</p>
            <p><a href="${disaster.link}" target="_blank">View on GDAC</a></p>
            <button class="btn blue darken-3 waves-effect waves-light view-details-btn" data-disaster-id="${disasterLayer.getLayerId(marker)}">View Details</button>
        `);
        
        marker.disasterData = disaster;
        return marker;
    }
    
    function addDisasterToTable(disaster) {
        const tableBody = document.getElementById('disaster-table-body');
        const row = document.createElement('tr');
        const formattedDate = new Date(disaster.pubDate).toLocaleString();
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${getDisasterTypeName(disaster.type)}</td>
            <td>${disaster.country || disaster.title.split('-')[0].trim()}</td>
            <td><span class="severity-${disaster.severity}">${disaster.severity}</span></td>
            <td>${disaster.description.substring(0, 100)}...</td>
            <td>
                <a href="#" class="view-on-map waves-effect waves-light btn-small blue" data-lat="${disaster.lat}" data-lng="${disaster.lng}">
                    <i class="material-icons left">map</i>View
                </a>
            </td>
        `;
        
        row.querySelector('.view-on-map').addEventListener('click', function(e) {
            e.preventDefault();
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            const tabInstance = M.Tabs.getInstance(document.querySelector('.tabs'));
            tabInstance.select('map-tab');
            map.setView([lat, lng], 8);
            disasterLayer.eachLayer(layer => {
                if (layer.getLatLng && layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
                    layer.openPopup();
                }
            });
        });
        
        tableBody.appendChild(row);
    }
    
    function getFilteredDisasterData() {
        if (!window.disasterData) return [];
        const typeFilter = document.getElementById('disaster-type-filter').value;
        const severityFilter = document.getElementById('severity-filter').value;
        const fromDate = M.Datepicker.getInstance(document.getElementById('date-from')).date;
        const toDate = M.Datepicker.getInstance(document.getElementById('date-to')).date;
        return window.disasterData.filter(disaster => {
            if (typeFilter && disaster.type !== typeFilter) return false;
            if (severityFilter && disaster.severity !== severityFilter) return false;
            if (fromDate && disaster.date < fromDate) return false;
            if (toDate && disaster.date > toDate) return false;
            return true;
        });
    }
    
    function getFilteredFacilityData() {
        if (!window.facilityData) return [];
        const facilityTypeFilter = document.getElementById('facility-type-filter').value;
        return window.facilityData.filter(facility => {
            if (facilityTypeFilter && facility.type !== facilityTypeFilter) return false;
            return true;
        });
    }
    
    function getDisasterTypeName(code) {
        const types = {
            'EQ': 'Earthquake',
            'FL': 'Flood',
            'TC': 'Tropical Cyclone',
            'DR': 'Drought',
            'VO': 'Volcano',
            'TS': 'Tsunami',
            'WF': 'Wildfire',
            'Unknown': 'Unknown'
        };
        return types[code] || code;
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-details-btn')) {
            const disasterId = e.target.dataset.disasterId;
            let disaster = null;
            disasterLayer.eachLayer(layer => {
                if (disasterLayer.getLayerId(layer) == disasterId) {
                    disaster = layer.disasterData;
                }
            });
            if (disaster) {
                // Set current disaster title for export filename
                window.currentDisasterTitle = disaster.title;
                showDisasterDetails(disaster);
            }
        }
    });
    
    // Update facility markers: color red if affected, green if not
    function updateFacilityMarkerStyles(disaster, radiusInKm) {
        window.facilityMarkers.forEach(marker => {
            const facility = marker.facilityData;
            const distance = calculateDistance(disaster.lat, disaster.lng, facility.lat, facility.lng);
            let iconHtml;
            if (distance <= radiusInKm) {
                iconHtml = '<span class="material-icons facility-marker-affected">local_hospital</span>';
            } else {
                iconHtml = '<span class="material-icons facility-marker">local_hospital</span>';
            }
            const newIcon = L.divIcon({
                html: iconHtml,
                className: 'facility-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            marker.setIcon(newIcon);
        });
        facilitiesLayer.refreshClusters && facilitiesLayer.refreshClusters();
    }
    
    function showDisasterDetails(disaster) {
        // Save the selected disaster globally.
        window.currentDisaster = disaster;
      
        const modal = document.getElementById('disaster-details-modal');
        const title = document.getElementById('disaster-details-title');
        const content = document.getElementById('disaster-details-content');
        title.textContent = disaster.title;
      
        const radiusInKm = parseInt(localStorage.getItem('bufferRadius') || '50');
        const impactedFacilities = [];
        if (window.facilityData) {
          window.facilityData.forEach(facility => {
            const distance = calculateDistance(disaster.lat, disaster.lng, facility.lat, facility.lng);
            if (distance <= radiusInKm) {
              impactedFacilities.push({ ...facility, distance: Math.round(distance * 10) / 10 });
            }
          });
        }
      
        let html = `
          <div class="row">
            <div class="col s12">
              <p><strong>Date:</strong> ${new Date(disaster.pubDate).toLocaleString()}</p>
              <p><strong>Type:</strong> ${getDisasterTypeName(disaster.type)}</p>
              <p><strong>Severity:</strong> <span class="severity-${disaster.severity}">${disaster.severity}</span></p>
              <p><strong>Coordinates:</strong> ${disaster.lat}, ${disaster.lng}</p>
              ${disaster.country ? `<p><strong>Affected Countries:</strong> ${disaster.country}</p>` : ''}
              ${disaster.eventName ? `<p><strong>Event Name:</strong> ${disaster.eventName}</p>` : ''}
              ${disaster.population ? `<p><strong>Population Impact:</strong> ${disaster.population}</p>` : ''}
              <p><strong>Description:</strong> ${disaster.description}</p>
              <p><a href="${disaster.link}" target="_blank">View on GDAC</a></p>
              <p><strong>Analysis Radius:</strong> ${radiusInKm} km</p>
            </div>
          </div>
          <div class="row">
            <div class="col s12">
              <h5>Potentially Impacted Facilities (${impactedFacilities.length})</h5>
              <p>Showing facilities within ${radiusInKm}km of the disaster epicenter</p>
              <table class="striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Distance (km)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
        `;
      
        if (impactedFacilities.length > 0) {
          impactedFacilities.sort((a, b) => a.distance - b.distance);
          impactedFacilities.forEach(facility => {
            html += `
              <tr>
                <td>${facility.name}</td>
                <td>${facility.type}</td>
                <td>${facility.distance}</td>
                <td>
                  <a href="#" class="view-facility waves-effect waves-light btn-small blue" data-lat="${facility.lat}" data-lng="${facility.lng}">
                    <i class="material-icons left">place</i>View
                  </a>
                </td>
              </tr>
            `;
          });
        } else {
          html += `<tr><td colspan="4">No facilities found within impact radius</td></tr>`;
        }
      
        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;
      
        content.innerHTML = html;
      
        // When the user clicks "Analyze this disaster", switch to the AI Analysis tab and prefill the query.
        document.getElementById('analyze-this-disaster').onclick = function() {
          const tabInstance = M.Tabs.getInstance(document.querySelector('.tabs'));
          tabInstance.select('ai-analysis-tab');
          document.getElementById('analysis-query').value = 
            `Analyze the impact of the ${getDisasterTypeName(disaster.type)} (${disaster.severity}) 
             that occurred on ${new Date(disaster.pubDate).toLocaleDateString()} 
             in ${disaster.country || 'the affected area'} 
             on health facilities within ${radiusInKm}km. What are the potential health risks and priorities?`;
          window.currentDisasterTitle = disaster.title;
          M.updateTextFields();
          M.Modal.getInstance(modal).close();
        };
      
        // Bind events to facility "View" buttons.
        setTimeout(() => {
          document.querySelectorAll('.view-facility').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const lat = parseFloat(this.dataset.lat);
              const lng = parseFloat(this.dataset.lng);
              M.Modal.getInstance(modal).close();
              map.setView([lat, lng], 12);
              facilitiesLayer.eachLayer(layer => {
                if (layer.getLatLng &&
                    Math.abs(layer.getLatLng().lat - lat) < 0.0001 &&
                    Math.abs(layer.getLatLng().lng - lng) < 0.0001) {
                  layer.openPopup();
                }
              });
            });
          });
        }, 100);
      
        M.Modal.getInstance(modal).open();
        updateFacilityMarkerStyles(disaster, radiusInKm);
      }
    
/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * This function returns the distance in kilometers between two coordinates.
 * 
 * @param {number} lat1 - Latitude of the first point in decimal degrees
 * @param {number} lon1 - Longitude of the first point in decimal degrees
 * @param {number} lat2 - Latitude of the second point in decimal degrees
 * @param {number} lon2 - Longitude of the second point in decimal degrees
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Convert inputs to numbers to handle string inputs
    lat1 = Number(lat1);
    lon1 = Number(lon1);
    lat2 = Number(lat2);
    lon2 = Number(lon2);
    
    // Validate inputs
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        console.error("Invalid coordinates passed to calculateDistance:", { lat1, lon1, lat2, lon2 });
        return Infinity; // Return Infinity for invalid inputs
    }
    
    // Check coordinates are in valid range
    if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
        console.warn("Suspicious coordinates in calculateDistance:", { lat1, lon1, lat2, lon2 });
        // Continue calculation but log a warning
    }
    
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert degrees to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;
    
    // Differences in coordinates
    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;
    
    // Haversine formula
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
}

    /**
     * Validates geographic coordinates to ensure they are within proper ranges.
     * 
     * @param {number} lat - Latitude in decimal degrees (-90 to 90)
     * @param {number} lng - Longitude in decimal degrees (-180 to 180)
     * @returns {boolean} True if coordinates are valid, false otherwise
     */
    function isValidCoordinate(lat, lng) {
        // Convert to numbers if they're strings
        lat = Number(lat);
        lng = Number(lng);
        
        // Check if values are numeric
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        // Check if within valid ranges
        if (Math.abs(lat) > 90) return false;
        if (Math.abs(lng) > 180) return false;
        
        return true;
    }

    /**
     * Debug function to check distance between two points and provide detailed information.
     * 
     * @param {Object} point1 - First point with name, lat, and lng properties
     * @param {Object} point2 - Second point with name, lat, and lng properties
     * @returns {Object} Object containing distance and validity information
     */
    function debugDistanceCalculation(point1, point2) {
        const result = {
            point1: {
                name: point1.name || 'Point 1',
                lat: point1.lat,
                lng: point1.lng,
                valid: isValidCoordinate(point1.lat, point1.lng)
            },
            point2: {
                name: point2.name || 'Point 2',
                lat: point2.lat,
                lng: point2.lng,
                valid: isValidCoordinate(point2.lat, point2.lng)
            },
            distance: null,
            isValid: false,
            message: ''
        };
        
        if (!result.point1.valid) {
            result.message = `Invalid coordinates for ${result.point1.name}`;
            return result;
        }
        
        if (!result.point2.valid) {
            result.message = `Invalid coordinates for ${result.point2.name}`;
            return result;
        }
        
        // Calculate distance
        result.distance = calculateDistance(
            point1.lat, point1.lng,
            point2.lat, point2.lng
        );
        
        result.isValid = true;
        result.message = `Distance between ${result.point1.name} and ${result.point2.name} is ${result.distance.toFixed(2)} km`;
        return result;
    }
    
    function addConnectionTestButton() {
        const settingsFooter = document.querySelector('#settings-modal .modal-footer');
        const testButton = document.createElement('a');
        testButton.href = "#!";
        testButton.className = "waves-effect waves-light btn blue";
        testButton.textContent = "Test DHIS2 Connection";
        testButton.style.marginRight = "10px";
        
        testButton.addEventListener('click', function() {
            if (testButton.disabled) return;
            testButton.disabled = true;
            M.toast({html: 'Testing DHIS2 connection...', classes: 'rounded blue'});
            testDhis2Connection()
                .then(info => {
                    M.toast({html: `Connected to DHIS2 ${info.version} at ${info.instanceName || 'Unknown'}`, classes: 'rounded green'});
                    testButton.disabled = false;
                })
                .catch(error => {
                    M.toast({html: `Connection failed: ${error.message}. Check URL and authentication.`, classes: 'rounded red'});
                    testButton.disabled = false;
                });
        });
        settingsFooter.insertBefore(testButton, settingsFooter.firstChild);
    }
    
    function testDhis2Connection() {
        const dhis2ApiUrl = localStorage.getItem('dhis2ApiUrl');
        if (!dhis2ApiUrl) { return Promise.reject(new Error('DHIS2 API URL not set')); }
        let baseApiUrl = dhis2ApiUrl.replace(/\/+$/, '');
        baseApiUrl = baseApiUrl.replace("http://", "https://");
        if (!baseApiUrl.endsWith('/api')) { baseApiUrl += '/api'; }
        const systemInfoUrl = `${baseApiUrl}/system/info`;
        const dhis2Username = localStorage.getItem('dhis2Username');
        const dhis2Password = localStorage.getItem('dhis2Password');
        const fetchOptions = { credentials: 'include', headers: {} };
        if (dhis2Username && dhis2Password) {
            const authHeader = 'Basic ' + btoa(`${dhis2Username}:${dhis2Password}`);
            fetchOptions.headers['Authorization'] = authHeader;
        }
        return fetch(systemInfoUrl, fetchOptions)
            .then(response => { if (!response.ok) { throw new Error(`DHIS2 API error: ${response.status}`); } return response.json(); })
            .then(data => { return data; });
    }
    
    function enhanceSettingsModal() {
        const settingsContent = document.querySelector('#settings-modal .modal-content');
        const dhis2ApiUrlRow = document.querySelector('#settings-modal .modal-content .row');
        const credentialsRow = document.createElement('div');
        credentialsRow.className = 'row';
        credentialsRow.innerHTML = `
            <div class="input-field col s12">
                <input id="dhis2-username" type="text" class="validate">
                <label for="dhis2-username">DHIS2 Username</label>
            </div>
            <div class="input-field col s12">
                <input id="dhis2-password" type="password" class="validate">
                <label for="dhis2-password">DHIS2 Password</label>
                <span class="helper-text">Credentials are used to authenticate API requests and are stored locally</span>
            </div>
        `;
        dhis2ApiUrlRow.parentNode.insertBefore(credentialsRow, dhis2ApiUrlRow.nextSibling);
        const saveBtn = document.getElementById('save-settings');
        const originalClickHandler = saveBtn.onclick;
        saveBtn.onclick = function() {
            const dhis2Username = document.getElementById('dhis2-username').value;
            const dhis2Password = document.getElementById('dhis2-password').value;
            if (dhis2Username) localStorage.setItem('dhis2Username', dhis2Username);
            if (dhis2Password) localStorage.setItem('dhis2Password', dhis2Password);
            if (originalClickHandler) originalClickHandler();
        };
        document.getElementById('dhis2-username').value = localStorage.getItem('dhis2Username') || '';
        document.getElementById('dhis2-password').value = localStorage.getItem('dhis2Password') || '';
        M.updateTextFields();
    }
    
    function addMapLegend() {
        const legendDiv = document.createElement('div');
        legendDiv.className = 'map-legend';
        legendDiv.innerHTML = `
            <h6>Disaster Types</h6>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons earthquake-marker">flash_on</span></div>
                    <div class="legend-label">Earthquake (EQ)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons flood-marker">waves</span></div>
                    <div class="legend-label">Flood (FL)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons cyclone-marker">rotate_right</span></div>
                    <div class="legend-label">Tropical Cyclone (TC)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons drought-marker">terrain</span></div>
                    <div class="legend-label">Drought (DR)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons volcano-marker">local_fire_department</span></div>
                    <div class="legend-label">Volcano (VO)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons tsunami-marker">water</span></div>
                    <div class="legend-label">Tsunami (TS)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons wildfire-marker">whatshot</span></div>
                    <div class="legend-label">Wildfire (WF)</div>
                </div>
            </div>
            <h6 style="margin-top: 15px;">Alert Severity</h6>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-icon"><span class="severity-Red" style="padding: 2px 6px;">●</span></div>
                    <div class="legend-label">Red (High)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="severity-Orange" style="padding: 2px 6px;">●</span></div>
                    <div class="legend-label">Orange (Medium)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-icon"><span class="severity-Green" style="padding: 2px 6px;">●</span></div>
                    <div class="legend-label">Green (Low)</div>
                </div>
            </div>
            <h6 style="margin-top: 15px;">Facilities</h6>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-icon"><span class="material-icons facility-marker">local_hospital</span></div>
                    <div class="legend-label">Health Facility</div>
                </div>
            </div>
        `;
        document.getElementById('map-container').appendChild(legendDiv);
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn-floating btn-small blue legend-toggle';
        toggleBtn.innerHTML = '<i class="material-icons">info</i>';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.bottom = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.zIndex = '1000';
        document.getElementById('map-container').appendChild(toggleBtn);
        toggleBtn.addEventListener('click', function() {
            legendDiv.style.display = (legendDiv.style.display === 'none') ? 'block' : 'none';
        });
    }
    
    addConnectionTestButton();
    enhanceSettingsModal();
    loadGdacData();
    if (localStorage.getItem('dhis2ApiUrl')) { loadDhis2Facilities(); }
    else { M.toast({html: 'Please set DHIS2 API URL in settings to load facilities', classes: 'rounded orange'}); addTestFacility(); }
    if (typeof addDebugButton !== 'function') { function addDebugButton() { console.log("Debug: addDebugButton dummy executed."); } }
    if (typeof debugFacilityLayer !== 'function') { function debugFacilityLayer() { console.log("Debug: Facility layer has", facilitiesLayer.getLayers().length, "markers."); } }
    addDebugButton();
    map.addLayer(facilitiesLayer);
    document.getElementById('toggle-facilities').checked = true;
    setTimeout(() => { debugFacilityLayer(); }, 3000);
});
