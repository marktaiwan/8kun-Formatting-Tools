/*
8kun Formatting Tools
Version 2.0.0
    - Adds a toolbar above the commenting area containing most of 8kun's formatting options
    - Press esc to close quick-reply window
    - Press c to go to catalog
    - Hover cursor over each button to show availiable shortcut

You can add your own toolbar items by modifying 'const formats', the basic syntax is as follows:
  format_name: {
      displayText: 'string',          displays on the toolbar button,
      altText: 'string',              optional, description for the mouseover tooltip,
      options: {
          prefix: 'string',           prepend to selection,
          suffic: 'string',           append to selection,
          multiline: true/false,      optional, can span across line breaks, defaults to false
          exclusiveLine: true/false   optional, the formatted text must be on its own line, defaults to false
      },
      edit: 'function'                the function to execute when the button is pressed
      shortcutKey: 'string'           optional, assign keyboard shortcut
  }
*/
(function () {
'use strict';
const CSS = `
/* generated by 8kun Formatting Tools */
.tf-toolbar {
  padding: 0px 5px 1px 5px;
}
.tf-toolbar :link {
  text-decoration: none;
}
.tf-toolbar a[data-format="bold"] {
  font-weight: bold;
}
.tf-toolbar a[data-format="italics"] {
  font-style: italic;
}
.tf-toolbar a[data-format="under"] {
  text-decoration underline;
}
.tf-toolbar a[data-format="code"] {
  font-family: "Courier New", Courier, monospace;
}
.tf-toolbar a[data-format="strike"] {
  text-decoration: line-through;
}
.tf-toolbar a[data-format="heading"] {
  color: #AF0A0F; font-weight: bold;
}
`;
const formats = {
  bold: {
    displayText: 'B',
    altText: 'bold',
    options: {
      prefix: "'''",
      suffix: "'''"
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    },
    shortcutKey: 'b'
  },
  italics: {
    displayText: 'i',
    altText: 'italics',
    options: {
      prefix: "''",
      suffix: "''"
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    },
    shortcutKey: 'i'
  },
  under: {
    displayText: 'U',
    altText: 'underline',
    options: {
      prefix: '__',
      suffix: '__'
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    },
    shortcutKey: 'u'
  },
  spoiler: {
    displayText: 'spoiler',
    altText: 'mark as spoiler',
    options: {
      prefix: '[spoiler]',
      suffix: '[/spoiler]'
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    },
    shortcutKey: 's'
  },
  code: {
    displayText: 'code',
    altText: 'code formatting',
    options: {
      prefix: '[code]',
      suffix: '[/code]',
      multiline: true
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    }
  },
  strike: {
    displayText: 'strike',
    altText: 'strikethrough',
    options: {
      prefix: '~~',
      suffix: '~~'
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    }
  },
  heading: {
    displayText: 'heading',
    altText: 'redtext',
    options: {
      prefix: '==',
      suffix: '==',
      exclusiveLine: true
    },
    edit: function (box, options) {
      wrapSelection(box, options);
    }
  }
};
const $ = (selector, parent = document) => parent.querySelector(selector);
function initCSS() {
  if ($('style.generated-css')) {
    const styleElement = $('style.generated-css');
    styleElement.innerHTML += CSS;
  } else {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.id = '8kun_formatting_tools_css';
    styleElement.innerHTML = CSS;
    document.head.append(styleElement);
  }
}
function wrapSelection(box, options) {
  'use strict';
  if (box == null) {
    return;
  }
  const {prefix, suffix, multiline = false, exclusiveLine = false} = options;

  // record scroll top to restore it later.
  const scrollTop = box.scrollTop;
  const selectionStart = box.selectionStart;
  const selectionEnd = box.selectionEnd;
  const breakSpace = ['\r', '\n'];
  const text = box.value;
  const emptyText = (selectionStart == selectionEnd);

  let beforeSelection = text.substring(0, selectionStart);
  let selectedText = text.substring(selectionStart, selectionEnd);
  let afterSelection = text.substring(selectionEnd);
  let trailingSpace = '';

  // remove trailing space
  let cursor = selectedText.length - 1;
  while (cursor > 0 && selectedText[cursor] === ' ') {
    trailingSpace += ' ';
    cursor--;
  }
  selectedText = selectedText.substring(0, cursor + 1);

  if (!multiline) selectedText = selectedText.replace(/(\r|\n|\r\n)/g, suffix + '$1' + prefix);

  if (exclusiveLine) {
    // buffer the begining of the selection until a linebreak
    let cursor = beforeSelection.length - 1;
    while (cursor >= 0 && breakSpace.indexOf(beforeSelection.charAt(cursor)) == -1) {
      cursor--;
    }
    selectedText = beforeSelection.substring(cursor + 1) + selectedText;
    beforeSelection = beforeSelection.substring(0, cursor + 1);

    // buffer the end of the selection until a linebreak
    cursor = 0;
    while (cursor < afterSelection.length && breakSpace.indexOf(afterSelection.charAt(cursor)) == -1) {
      cursor++;
    }
    selectedText += afterSelection.substring(0, cursor);
    afterSelection = afterSelection.substring(cursor);
  }

  box.value = beforeSelection + prefix + selectedText + suffix + trailingSpace + afterSelection;

  // If no text were highlighted, place the caret inside
  // the formatted section, otherwise place it at the end
  if (emptyText) {
    box.selectionEnd = box.value.length - afterSelection.length - suffix.length;
  }
  else {
    box.selectionEnd = box.value.length - afterSelection.length;
  }
  box.selectionStart = box.selectionEnd;
  box.scrollTop = scrollTop;
}
function main() {
  if (window.active_page == 'thread' || window.active_page == 'index') {
    const textarea = $('textarea[name="body"]');
    if (!textarea) return;
    initCSS();

    // generate the HTML for the toolbar
    const strBuilder = [];
    for (const format in formats) {
      if (formats.hasOwnProperty(format) && formats[format].displayText != null) {
        const name = formats[format].displayText;
        const key = formats[format].shortcutKey;

        // add tooltip text
        let altText = formats[format].altText || '';
        if (altText) {
          if (key) {
            altText += ` (ctrl+${key})`;
          }
          altText = `title="${altText}"`;
        }

        strBuilder.push(`<a href="javascript:void(0)" ${altText} data-format="${format}">${name}</a>`);
      }
    }

    const toolbar = document.createElement('div');
    toolbar.classList.add('tf-toolbar');
    toolbar.innerHTML = strBuilder.join(' | ');
    textarea.parentElement.insertBefore(toolbar, textarea);

    /*  Attach event listeners */
    // keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (!e.target.matches('textarea[name="body"]')) return;
      const textbox = e.target;
      if (e.ctrlKey) {
        const char = String.fromCharCode(e.which).toLowerCase();
        for (const prop in formats) {
          if (char === formats[prop].shortcutKey) {
            formats[prop].edit(textbox, formats[prop].options);
            e.preventDefault();
          }
        }
      }
    });
    // close quick reply when esc is prssed
    document.addEventListener('keydown', e => {
      if (e.which == 27 && e.target.matches('#quick-reply textarea[name="body"]')) {
        $('#quick-reply .close-btn').click();
      }
    });
    // switch to catelog page when C is pressed
    document.addEventListener('keydown', e => {
      if (e.target === document.body
        && e.which == 67
        && !e.ctrlKey
        && !e.altKey
        && !e.shiftKey
      ) {
        document.location.href = '//' + document.location.host + '/' + window.board_name + '/catalog.html';
      }
    });
    // toolbar buttons
    document.addEventListener('click', e => {
      if (!e.target.matches('.tf-toolbar a[data-format]')) return;
      const textbox = $('textarea', e.target.parentElement.parentElement);
      const format = e.target.dataset.format;
      if (format) {
        formats[format].edit(textbox, formats[format].options);
        textbox.focus();
      }
    });
  }
}
function onReady(fn) {
  if (document.readyState == 'loading') {
    window.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}
onReady(main);
})();
