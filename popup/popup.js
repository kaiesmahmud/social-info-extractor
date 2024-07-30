// document.addEventListener('DOMContentLoaded', () => {
//     chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
//         showLoading();
//         chrome.tabs.sendMessage(tabs[0].id, {action: "extract"}, (response) => {
//           if (chrome.runtime.lastError) {
//             console.error(chrome.runtime.lastError);
//             displayError("An error occurred while extracting data.");
//           } else {
//             displayData(response);
//           }
//         });
//       });
//   });
  
//===========2nd =============
document.addEventListener('DOMContentLoaded', () => {
    showLoading();
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "extract"}, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          displayError("An error occurred while extracting data.");
        } else {
          displayData(response.data);
          displayUrlInfo(response);
        }
      });
    });
  });


  function displayUrlInfo(response) {
    const container = document.getElementById('extracted-data');
    
    const urlInfo = document.createElement('div');
    urlInfo.classList.add('url-info');
    
    const currentUrlDiv = document.createElement('div');
    currentUrlDiv.textContent = `Current URL: ${response.currentUrl}`;
    urlInfo.appendChild(currentUrlDiv);
    
    if (response.isMainDomain) {
      const contactPageDiv = document.createElement('div');
      contactPageDiv.textContent = `Contact Page: ${response.contactPageStatus}`;
      if (response.contactPageStatus === 'found') {
        console.log('Contact page data:', response.data);
      }
      urlInfo.appendChild(contactPageDiv);
    }
    
    container.appendChild(urlInfo);
  }
  



  function displayData(data) {
      const container = document.getElementById('extracted-data');
      container.innerHTML = "";
    
    ['emails', 'phones', 'socials'].forEach(type => {
      const section = document.createElement('div');

    const headerDiv = document.createElement('div');
    headerDiv.classList.add('flex', 'items-center', 'justify-between');
    headerDiv.innerHTML = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>`;

    if (type === 'emails') {
      const copyAllEmailButton = document.createElement('button');
      copyAllEmailButton.textContent = 'Copy All';
      copyAllEmailButton.onclick = () => {
        const allEmails = data.emails.join('\n');
        navigator.clipboard.writeText(allEmails);
        copyAllEmailButton.textContent = 'All Emails Copied!';
        setTimeout(() => {
          copyAllEmailButton.textContent = 'Copy All';
        }, 2000);
      };
      headerDiv.appendChild(copyAllEmailButton);
    }

    section.appendChild(headerDiv);
      
    if (type === 'socials') {
        data[type].forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('flex-col'); // Add flex-col for column layout

        const socialTitle = document.createElement('div');
        socialTitle.classList.add('social_title'); // Add social_title class
        socialTitle.textContent = item.platform;
        itemDiv.appendChild(socialTitle);

        const socialLinkDiv = document.createElement('div');
        socialLinkDiv.classList.add('flex', 'items-center', 'justify-between');
        socialLinkDiv.textContent = item.url;
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.onclick = () => {
            console.log(" copy for ", item)

          navigator.clipboard.writeText(item.url);
          copyButton.textContent = 'Copied';
          setTimeout(() => {
            copyButton.textContent = 'Copy';
          }, 2000); // Change back to 'Copy' after 2 seconds
        };
        socialLinkDiv.appendChild(copyButton);
        itemDiv.appendChild(socialLinkDiv);

        section.appendChild(itemDiv); 
        });
    } else {
        data[type].forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('flex', 'items-center', 'justify-between'); // Add classes here
            itemDiv.textContent = item;
            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copy';
            copyButton.onclick = () => {
                console.log(" copy for ", item)

                navigator.clipboard.writeText(item);
                copyButton.textContent = 'Copied !';
                setTimeout(() => {
                copyButton.textContent = 'Copy';
                }, 2000); // Change back to 'Copy' after 2 seconds
            };
            itemDiv.appendChild(copyButton);
            section.appendChild(itemDiv);
        });
      }
      
      container.appendChild(section);
    });

    const copyAllButton = document.createElement('button');
    copyAllButton.textContent = 'Copy All';
    copyAllButton.onclick = () => {
    copyAll(data);
    copyAllButton.textContent = 'All Copied!';
    setTimeout(() => {
        copyAllButton.textContent = 'Copy All';
    }, 2000); // Change back to 'Copy All' after 2 seconds
    };
    container.appendChild(copyAllButton);
        
    const csvButton = document.createElement('button');
    csvButton.textContent = 'Extract as CSV';
    csvButton.onclick = () => extractCSV(data);
    container.appendChild(csvButton);
  } 

  function copyAll(data) {
    const text = Object.entries(data).map(([type, items]) => {
      if (type === 'socials') {
        return `${type.toUpperCase()}:\n${items.map(item => `${item.platform}: ${item.url}`).join('\n')}`;
      }
      return `${type.toUpperCase()}:\n${items.join('\n')}`;
    }).join('\n\n');
    navigator.clipboard.writeText(text);
  }
  
  function extractCSV(data) {
    const csv = Object.entries(data).flatMap(([type, items]) => {
      if (type === 'socials') {
        return items.map(item => `${type},${item.platform},${item.url}`);
      }
      return items.map(item => `${type},,${item}`);
    }).join('\n');
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_data.csv';
    a.click();
  }

  function showLoading() {
    const container = document.getElementById('extracted-data');
    container.innerHTML = '<p>Loading...</p>';
  }  
  function displayError(message) {
    const container = document.getElementById('extracted-data');
    container.innerHTML = `<p class="error">${message}</p>`;
  }