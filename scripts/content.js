chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    const currentPageData = extractInfo();
    const currentUrl = window.location.href;
    console.log("Current page info extraction complete checking for /contact");
    
    // Check if we're on the main domain
    if (window.location.pathname === '/' || window.location.pathname === '') {
      console.log("Fetching contact page data");
      fetch(window.location.origin + '/contact')
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const contactDoc = parser.parseFromString(html, 'text/html');
          const contactPageData = extractInfo(contactDoc);
          
          // Merge data from both pages
          const mergedData = mergeData(currentPageData, contactPageData);
          sendResponse({
            data: mergedData,
            currentUrl: currentUrl,
            contactPageStatus: 'found',
            isMainDomain: true
          });
        })
        .catch(error => {
          console.error('Error fetching contact page:', error);
          sendResponse({
            data: currentPageData,
            currentUrl: currentUrl,
            contactPageStatus: 'not found',
            isMainDomain: true
          });
        });
      return true; // Indicates we'll respond asynchronously
    } else {
      // We're not on the main domain, just send current page data
      sendResponse({
        data: currentPageData,
        currentUrl: currentUrl,
        isMainDomain: false
      });
    }
  }
});


function mergeData(data1, data2) {
  return {
    emails: [...new Set([...data1.emails, ...data2.emails])],
    phones: [...new Set([...data1.phones, ...data2.phones])],
    socials: [...data1.socials, ...data2.socials].filter((v, i, a) => 
      a.findIndex(t => t.url === v.url) === i
    )
  };
}

function extractInfo() { 
  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/gi;
  const phoneRegex = /(?:\+|00)?(?:\d{1,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
 
  const phones = document.body.innerText.match(phoneRegex) || [];

  // Search for emails in both visible text and HTML content
  const visibleEmails = document.body.innerText.match(emailRegex) || [];
  const htmlEmails = document.body.innerHTML.match(emailRegex) || [];
  const allEmails = [...visibleEmails, ...htmlEmails];

  const socialPatterns = {
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.-]+/gi,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[\w.-]+/gi,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/[\w.-]+/gi,
    twitter: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/[\w.-]+/gi,
    reddit: /(?:https?:\/\/)?(?:www\.)?reddit\.com\/user\/[\w.-]+/gi,
    youtube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/[\w.-]+/gi,
    tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+/gi,
    discord: /(?:https?:\/\/)?(?:www\.)?discord\.com\/invite\/[\w.-]+/gi,
    whatsapp: /(?:https?:\/\/)?(?:www\.)?wa\.me\/\d+/gi,
    messenger: /(?:https?:\/\/)?(?:www\.)?m\.me\/[\w.-]+/gi
  };

  const socials = Object.entries(socialPatterns).flatMap(([platform, pattern]) => {
    const matches = document.body.innerHTML.match(pattern) || [];
    return matches.map(match => ({ platform, url: match }));
  });

  // Filter duplicate social links
  const filteredSocials = socials.reduce((acc, social) => {
    const existingIndex = acc.findIndex(item => item.url === social.url);
    if (existingIndex === -1) {
      acc.push(social);
    }
    return acc;
  }, []);
// Remove duplicate emails and phones using a Set
  const uniqueEmails = [...new Set(allEmails)]; 
  // const uniquePhones = [...new Set(phones)];
  const uniquePhones = uniquePhoneNumbers(phones);

  return { emails: uniqueEmails, phones: uniquePhones, socials: filteredSocials };
}

 
function uniquePhoneNumbers(phoneArray) {
  console.log("Original phone array:", phoneArray);

  // Create a map to store unique numbers
  const uniqueMap = new Map();

  phoneArray.forEach(phone => {
    // Remove +, space, (, and ) from the number
    const cleanNumber = phone.replace(/[\+\s\(\)-]/g, '');
    
    console.log(`Original: ${phone}, Cleaned: ${cleanNumber}`);

    // If this clean number isn't in our map yet, add it
    if (!uniqueMap.has(cleanNumber)) {
      uniqueMap.set(cleanNumber, phone);
    }
  });

  console.log("Unique map:", uniqueMap);

  // Convert the map values back to an array
  const result = Array.from(uniqueMap.values());
  
  console.log("Final unique phone numbers:", result);

  return result;
}
//twitter.com/intent
// facebook.com/sharer