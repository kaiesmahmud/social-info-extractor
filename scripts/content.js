// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "extract") {
//     sendResponse(extractInfo());
//   }
// });


// ----------2nd-------
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "extract") {
//     const currentPageData = extractInfo();
//     console.log(" current page info extraction complete checking for /contact")
//     // Check if we're on the main domain
//     if (window.location.pathname === '/' || window.location.pathname === '') {
//       // Fetch the contact 
//       console.log(" fetching contact page data")
//       fetch(window.location.origin + '/contact')
//         .then(response => response.text())
//         .then(html => {
//           const parser = new DOMParser();
//           const contactDoc = parser.parseFromString(html, 'text/html');
//           const contactPageData = extractInfo(contactDoc);
          
//           // Merge data from both pages
//           const mergedData = mergeData(currentPageData, contactPageData);
//           sendResponse(mergedData);
//         })
//         .catch(error => {
//           console.error('Error fetching contact page:', error);
//           sendResponse(currentPageData);
//         });
//       return true; // Indicates we'll respond asynchronously
//     } else {
//       // We're not on the main domain, just send current page data
//       sendResponse(currentPageData);
//     }
//   }
// });


// =========3rd =============

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
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g; 
  const phoneRegex = /\+\d{1,3}[\s-]?(?:\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}/g;


  const emails = document.body.innerText.match(emailRegex) || [];
  const phones = document.body.innerText.match(phoneRegex) || [];
  
  
  const socialPatterns = {
    facebook: /facebook\.com\/[\w.]+/,
    instagram: /instagram\.com\/[\w.]+/,
    // linkedin:  /linkedin\.com\/company\/[\w.]+/, 
    linkedin:  /linkedin\.com\/(?:in|company|public-profile\/(in|pub))\/[\w\-_\.\&+%]+/,

    twitter: /twitter\.com\/[\w]+/,
    reddit: /reddit\.com\/u\/[\w-]+/,
    youtube: /youtube\.com\/channel\/UC[\w-]+/,
    tiktok: /tiktok\.com\/@[\w]+/
  };
 
  const socials = Object.entries(socialPatterns).flatMap(([platform, pattern]) => {
    const matches = document.body.innerHTML.match(new RegExp(pattern, 'g')) || []; 
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

  // Remove duplicate emails using a Set
  const uniqueEmails = new Set(emails);

  // Convert Set back to an array
  const filteredEmails = Array.from(uniqueEmails);


  return { emails:filteredEmails, phones, socials:filteredSocials };
}


//twitter.com/intent
// facebook.com/sharer