/**
 * RailAssistant 1-Tap Mobile Bookmarklet & Auto-Fill Bridge
 * Non-intrusive client-side helper executed by the user in their own browser on the official portal.
 */

export function generateAutoFillBookmarklet(
  from: string,
  to: string,
  date: string,
  seatClass: string
): string {
  const cleanFrom = from.replace(/"/g, '\\"');
  const cleanTo = to.replace(/"/g, '\\"');
  const cleanDate = date.replace(/"/g, '\\"');
  const cleanClass = seatClass.replace(/"/g, '\\"');

  const code = `
    javascript:(function(){
      function triggerInput(el, val){
        if(!el) return;
        el.focus();
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      var fromInput = document.querySelector('input[placeholder*="From Station"], #dest_from, input[name*="from"], input#fromcity');
      var toInput = document.querySelector('input[placeholder*="To Station"], #dest_to, input[name*="to"], input#tocity');
      var dateInput = document.querySelector('input[placeholder*="Pick a date"], #doj, input[name*="date"], input#doj');
      var classSelect = document.querySelector('select[name*="class"], select#choose_class, select#class');
      
      triggerInput(fromInput, "${cleanFrom}");
      triggerInput(toInput, "${cleanTo}");
      triggerInput(dateInput, "${cleanDate}");
      
      if(classSelect) {
        for(var i=0; i<classSelect.options.length; i++){
          if(classSelect.options[i].value.toLowerCase().includes("${cleanClass.toLowerCase()}")){
            classSelect.selectedIndex = i;
            classSelect.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }
      
      setTimeout(function(){
        var btn = Array.from(document.querySelectorAll('button')).find(function(el){
          return el.textContent && el.textContent.toUpperCase().includes('SEARCH TRAINS');
        });
        if(btn) btn.click();
      }, 300);
    })();
  `
    .replace(/\s+/g, ' ')
    .trim();

  return code;
}

/**
 * Formats official Railway deep search URL:
 * https://eticket.railway.gov.bd/booking/train/search?fromcity={from}&tocity={to}&doj={date}&class={class}
 */
export function generateDeepSearchUrl(
  from: string,
  to: string,
  date: string,
  seatClass: string
): string {
  // Format date to DD-Mon-YYYY if needed, or maintain YYYY-MM-DD
  return `https://eticket.railway.gov.bd/booking/train/search?fromcity=${encodeURIComponent(
    from
  )}&tocity=${encodeURIComponent(to)}&doj=${encodeURIComponent(
    date
  )}&class=${encodeURIComponent(seatClass)}`;
}

/**
 * Copies passenger details or bookmarklet to clipboard with graceful fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
