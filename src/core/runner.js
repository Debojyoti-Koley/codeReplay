const MAX_TRACES = 1000;

export function run(instructedCode, onTrace, onDone, onError) {
    const existing = document.getElementById('codereplay-sandbox');
    if (existing) {
        existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'codereplay-sandbox';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    let traceCount = 0;
    let finished = false;

    function handleMessage(event) {
        const data = event.data;
        if (!data || data.source !== 'codereplay') return;

        if (data.type === 'trace') {
            if (traceCount >= MAX_TRACES) {
                if (traceCount === MAX_TRACES) {
                    onError(`Execution exceeded ${MAX_TRACES} steps, Showing first ${MAX_TRACES} traces only.`);
                }
                traceCount++;
                return;
            }
            traceCount++;
            onTrace(data.event)
        }

        if (data.type === 'done') {
            finished = true;
            cleanup();
            onDone();
        }

        if (data.type === 'error') {
            finished = true;
            cleanup();
            onError(data.message);
        }
    }

    function cleanup() {
        window.removeEventListener('message', handleMessage);
        const el = document.getElementById('codereplay-sandbox');
        if (el) {
            el.remove();
        }
    }

    window.addEventListener('message', handleMessage);

    const html = buildIframeHTML(instructedCode);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    setTimeout(() => {
        if (!finished) {
            cleanup();
            onError('Execution timed out after 5 seconds.');
        }
    }, 5000);
}

function buildIframeHTML(code) {
    return `<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
  var __traces = [];

  function __trace(event) {
    var serialized = {};
    serialized.type = event.type;
    serialized.name = event.name;
    serialized.line = event.line;

    try {
      var raw = event.value;
      if (raw === null) serialized.value = 'null';
      else if (raw === undefined) serialized.value = 'undefined';
      else if (typeof raw === 'function') serialized.value = '[Function]';
      else if (typeof raw === 'object') serialized.value = JSON.stringify(raw);
      else serialized.value = String(raw);
    } catch(e) {
      serialized.value = '[unserializable]';
    }

    if (event.args) {
      try {
        var args = {};
        Object.keys(event.args).forEach(function(k) {
          var v = event.args[k];
          if (v === null) args[k] = 'null';
          else if (v === undefined) args[k] = 'undefined';
          else if (typeof v === 'function') args[k] = '[Function]';
          else if (typeof v === 'object') args[k] = JSON.stringify(v);
          else args[k] = String(v);
        });
        serialized.args = args;
      } catch(e) {
        serialized.args = {};
      }
    }

    window.parent.postMessage({ source: 'codereplay', type: 'trace', event: serialized }, '*');
  }

  try {
    ${code}
    window.parent.postMessage({ source: 'codereplay', type: 'done' }, '*');
  } catch(e) {
    window.parent.postMessage({ source: 'codereplay', type: 'error', message: e.message }, '*');
  }
<\/script>
</body>
</html>`
}