async function main() {
    const ratesCSV = chrome.runtime.getURL("src/assets/ratefs.csv");
    let csvData;

    await fetch(ratesCSV)
        .then((response) => response.text())
        .then((csvContent) => {
            Papa.parse(csvContent, {
                delimiter: ";",
                header: true,
                complete: function (results) {
                    if (results.errors.length) {
                        console.error("Error while reading CSV: ");
                        results.errors.forEach(error => {
                            console.error(error.message);
                        });
                        return;
                    }

                    if (results.data.length) {
                        csvData = results.data;
                    }
                },
            });
        })
        .catch(error => console.log(`Error while getting rates CSV file: ${error.message}`));

    if (!csvData) return;

    //TOOD: remove timeout and find a way to wait for whole page to load
    setTimeout(() => {
        const iconImg = document.createElement("img");
        iconImg.src = chrome.runtime.getURL("src/assets/icons/baguette.svg");
        iconImg.classList.add("copy-img");

        const copyButton = document.createElement("button");
        copyButton.className = "copy-button";
        copyButton.appendChild(iconImg);

        const profileImage = document.querySelector("img.profile-image");
        const profileImageDiv = profileImage.parentNode;
        profileImageDiv.appendChild(copyButton);

        copyButton.addEventListener("click", async function () {
            //copying to clipboard using existing button
            const existingButton = document.querySelector("button.profile-util-copy");
            existingButton.click();

            //manipulate HTML string and rewrite into clipboard
            const html = await getHTMLFromClipboard();
            const updatedHTML = await updateHTML(html, csvData);
            await saveHTMLToClipboard(updatedHTML);
        });
    }, 3000);
}

function getFrRatesByAuStandard(auStandard, csvData) {
    const foundRow = csvData.find((row) => row.au_standard === auStandard);

    if (foundRow) {
        return {
            frStandard: foundRow.fr_standard,
            frPrepaid: foundRow.fr_prepaid,
        };
    } else {
        return null;
    }
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

async function updateHTML(htmlString, csvData) {
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlString;

    const profilePicture = tempElement.querySelector('img');
    if (profilePicture) {
        profilePicture.setAttribute('height', '120');
    }

    const bulletPointListElement = tempElement.querySelector("ul");

    updateRatesElements(bulletPointListElement, csvData);

    addLocationElement(bulletPointListElement);

    const updatedHTML = tempElement.innerHTML;
    tempElement.remove();
    return updatedHTML;
}

function updateRatesElements(bulletPointListElement, csvData) {
    const standardRateListItemElement = bulletPointListElement.querySelector("li:first-child");
    const prepaidRateListItemElement = bulletPointListElement.querySelector("li:last-child");
    if (!standardRateListItemElement || !prepaidRateListItemElement) return;

    const matchAuStandardRate = standardRateListItemElement.innerHTML.match(/\$\d+/);
    const matchAuPrepaidRate = prepaidRateListItemElement.innerHTML.match(/\$\d+/);
    if (!matchAuStandardRate || !matchAuPrepaidRate) return;

    const auStandardRate = matchAuStandardRate[0];
    const auPrepaidRate = matchAuPrepaidRate[0];
    const frRates = getFrRatesByAuStandard(auStandardRate, csvData);
    if (!frRates) return;

    standardRateListItemElement.innerHTML = standardRateListItemElement.innerHTML.replace(auStandardRate + "+GST", frRates.frStandard + " + VAT");
    prepaidRateListItemElement.innerHTML = prepaidRateListItemElement.innerHTML.replace(auPrepaidRate + "+GST", frRates.frPrepaid + " + VAT");
    prepaidRateListItemElement.innerHTML = prepaidRateListItemElement.innerHTML.replace("40h", "37,5h");

    const termsAndConditionsElement = prepaidRateListItemElement.querySelector("a");
    if (!termsAndConditionsElement) return;

    termsAndConditionsElement.setAttribute("href", "https://ssw.fr/terms-and-conditions/");
}

function addLocationElement(bulletPointListElement) {
    const locationElement = document.querySelector("svg.fa-location-dot").parentNode;
    const location = locationElement.textContent;
    const locationListItemElement = document.createElement("li");
    locationListItemElement.innerText = "🗺️ Location: " + location;
    bulletPointListElement.appendChild(locationListItemElement);
}

async function saveHTMLToClipboard(htmlString) {
    const clipboardItem = new ClipboardItem({
        "text/html": new Blob([htmlString], { type: "text/html" }),
        "text/plain": new Blob([htmlString], { type: "text/plain" }),
    });

    await navigator.clipboard.write([clipboardItem]).then(
        () => console.log("Updated HTML for France wrote to clipboard!"),
        (error) => alert(error)
    );
}

main();
