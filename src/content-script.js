//TOOD: remove timeout and find a way to wait for whole page to load
setTimeout(() => {
    const iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL('src/assets/icons/baguette.svg');
    iconImg.classList.add('copy-img');

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.appendChild(iconImg);

    const profileImage = document.querySelector('img.profile-image');
    const profileImageSrc = profileImage.src;
    const profileImageDiv = profileImage.parentNode;
    profileImageDiv.appendChild(copyButton);

    copyButton.addEventListener('click', async function () {
        //copying to clipboard using existing button
        const existingButton = document.querySelector('button.profile-util-copy');
        existingButton.click();

        //manipulate HTML string and rewrite into clipboard
        const html = await getHTMLFromClipboard();
        const updatedHTML = updateHTML(html);
        await saveHTMLToClipboard(updatedHTML);
    });

}, 5000);

function updateHTML(htmlString) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = htmlString;

    const bulletPointListElement = tempElement.querySelector('ul');

    const standardRateListItemElement = bulletPointListElement.querySelector('li:first-child');

    const prepaidRateListItemElement = bulletPointListElement.querySelector('li:last-child');
    if (prepaidRateListItemElement) {
        prepaidRateListItemElement.innerHTML = prepaidRateListItemElement.innerHTML.replace('40h', '37,5h');
        const termsAndConditionsElement = prepaidRateListItemElement.querySelector('a');
        if (termsAndConditionsElement) {
            termsAndConditionsElement.setAttribute('href', 'https://ssw.fr/terms-and-conditions/');
        }
    }

    const locationElement = document.querySelector('svg.fa-location-dot').parentNode;
    const location = locationElement.textContent;

    const locationListItemElement = document.createElement('li');
    locationListItemElement.innerText = "🗺️ Location: "+ location;
    bulletPointListElement.appendChild(locationListItemElement);

    const updatedHTML = tempElement.innerHTML;
    tempElement.remove();
    return updatedHTML;
}

async function getHTMLFromClipboard() {
    try {
        const clipboardItems = await navigator.clipboard.read();

        const htmlItem = clipboardItems.find(({ types }) => types.includes("text/html"));
        if (htmlItem) {
            const htmlBlob = await htmlItem.getType("text/html");
            const html = await htmlBlob.text();
            return html;
        }
    } catch (err) {
        console.error(err.name, err.message);
    }
}

async function saveHTMLToClipboard(htmlString) {

    const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlString], { type: 'text/html' }),
        'text/plain': new Blob([htmlString], { type: 'text/plain' })
    });

    await navigator.clipboard.write([clipboardItem]).
        then(() => console.log("Updated HTML for France wrote to clipboard!"),
            error => alert(error));
}