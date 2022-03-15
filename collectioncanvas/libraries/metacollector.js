/////////////////// USER INPUT MANAGEMENT ////////////////////////////////////////////////////

//let userInputcollectorAddress = "tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd"; // juliendorra's address

let SANDBOX = false

const sandboxTokens = [
    "collectioncanvas/sandbox/tokens/0000.json",
    "collectioncanvas/sandbox/tokens/0001.json",
    "collectioncanvas/sandbox/tokens/0002.json",
    "collectioncanvas/sandbox/tokens/0003.json",
    "collectioncanvas/sandbox/tokens/0004.json",
    "collectioncanvas/sandbox/tokens/0005.json",
    "collectioncanvas/sandbox/tokens/0006.json",
    "collectioncanvas/sandbox/tokens/0007.json",
    "collectioncanvas/sandbox/tokens/0008.json",
    "collectioncanvas/sandbox/tokens/0009.json",
]

let metacollector = {
    walletAddress: "",
    seed: "",
    iteration: 1,
    canvas: {
        visualWidth: 0,
        visualHeight: 0
    },
    artfragments: []
}

let url = new URL(location.href);
let collectorAddressParam = url.searchParams.get("collectoraddress");

metacollector.iteration = parseInt(location.hash.substring(1))

let collectionCanvas

let canvasWidth
let canvasHeight

if (collectorAddressParam) {
    metacollector.walletAddress = collectorAddressParam;
}
if (!metacollector.walletAddress) {
    metacollector.walletAddress = ""
}

if (!Number.isInteger(metacollector.iteration)) {
    metacollector.iteration = 1
    onIterationUpdated(metacollector.iteration)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    } return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function init() {

    document.getElementById('collectoraddress').value = metacollector.walletAddress;

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResized);

    document.getElementById('drawcollectionbutton').addEventListener('click', onUserEnteredCollectorAddress)

    const canvasObserver = new MutationObserver(onCanvasReady)

    const canvasObserverConfig = { childList: true }

    const targetNode = document.getElementsByTagName('body')[0]

    canvasObserver.observe(targetNode, canvasObserverConfig)
}

function onCanvasReady(mutationList, observer) {

    collectionCanvas = document.getElementsByTagName('canvas')[0];

    collectionCanvas.addEventListener('click', iterateMetacollector)

    document.getElementById("canvascontainer").appendChild(collectionCanvas)

    onWindowResized()

    if (metacollector.walletAddress) {
        fetchCollectorData(metacollector.walletAddress)
    }
    else {
        noTokensToShow()
    }
}

function noTokensToShow() {
    // manage no tokens found
    document.getElementById('nofragment').style.display = "block"

    var ctx = collectionCanvas.getContext('2d');
    ctx.resetTransform()
    ctx.font = `${(canvasWidth / 13)}px sans-serif`
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.fillText("no art fragments collected", canvasWidth / 2, canvasHeight / 2)
}

function onKeyDown(event) {

    if (document.activeElement == document.getElementById('collectoraddress')) {

        if (event.key == "Enter") {
            onUserEnteredCollectorAddress();
        }
    }
    else {
        const sandboxIndex = parseInt(event.key)
        if (SANDBOX && (sandboxIndex >= 0 || sandboxIndex <= 9)) {
            console.log(sandboxIndex, sandboxTokens[sandboxIndex])
            renderSandboxCanvas(sandboxTokens[sandboxIndex])
        }
        else if (event.key == "u" || event.code == "U") {
            iterateMetacollector()
        }
    }

}

function onUserEnteredCollectorAddress() {

    metacollector.walletAddress = document.getElementById('collectoraddress').value;

    metacollector.seed = xmur3(metacollector.walletAddress)

    url.searchParams.set("collectoraddress", metacollector.walletAddress);

    window.history.replaceState({}, '', url.toString());

    fetchCollectorData(metacollector.walletAddress)
}

function renderSandboxCanvas(url) {

    console.log("sandbox: ", SANDBOX)

    fetch(url)
        .then((response) => response.json())
        .then((tokenArray) => {
            console.log(tokenArray)
            parseTokens(tokenArray)
        })
}

function iterateMetacollector(event) {
    metacollector.iteration++
    console.log(metacollector.iteration)
    paintCollection(metacollector)
    onIterationUpdated(metacollector.iteration)
}

function onIterationUpdated(iteration) {

    iteration = !iteration ? "" : iteration
    url.hash = iteration
    window.history.replaceState({}, '', url.toString());
    metacollector.iteration = parseInt(location.hash.substring(1))
}

function fetchCollectorData(userInputCollectorAddress) {

    nftQuery = fetchTokens(userInputCollectorAddress)

    nftQuery
        .then(
            (tokens) => {
                parseTokens(tokens)
                stat(tokens, userInputCollectorAddress)
            }
        )

    // https://github.com/whatwg/fetch/issues/113#issuecomment-409922366

    fetchProfile(userInputCollectorAddress)
        .then((response) => {
            if (response.ok && response.status != 204) return response.json()
            else return ''
        })
        .catch((error) => {
            console.log(error)
        })
        .then(showProfile)

}

function showProfile(data) {

    // console.log(data)

}

function onWindowResized() {

    let pixelDensity = 1

    if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
            pixelDensity = window.devicePixelRatio;
        }
    }

    canvasWidth = Math.min(window.innerWidth * 1, window.innerHeight * 0.7) * pixelDensity
    canvasHeight = canvasWidth

    collectionCanvas.width = canvasWidth
    collectionCanvas.height = canvasHeight
    collectionCanvas.style.width = canvasWidth / pixelDensity + "px"
    collectionCanvas.style.height = canvasHeight / pixelDensity + "px"
    metacollector.canvas.visualWidth = canvasWidth / pixelDensity
    metacollector.canvas.visualHeight = canvasWidth / pixelDensity

    paintCollection(metacollector)
}

////////////////////////// STAT /////////////////////////////////////////////////////

const statsUrl = "https://script.google.com/macros/s/AKfycbxPRDRkkGsRD7uS6CwcaGMFWPtcpvp2KMvpNtX8XgV-dcqS-RqzWkuJiA0PBeMsMlchag/exec"


function stat(tokens, wallet) {

    console.log(tokens, wallet)
    let stat = { sandbox: SANDBOX, wallet: wallet, tokens: tokens.length, forwards: "" };

    const endpoint =
        statsUrl
        + "?stat="
        + encodeURIComponent(JSON.stringify(stat))

    fetch(endpoint)
        .then(
            (response) => {
                console.log(response.json())
            }
        )
}

/////////////////// COLLECTOR GALLERY DATA FETCHING ////////////////////////////////////////////////////

const ojktcomIndexerEndpoint = "https://data.objkt.com/v2/graphql";

const tztkProfileEndpointStart = "https://api.tzkt.io/v1/accounts/"
const tztkProfileEndpointEnd = "/metadata"
// schema
// {
//   "kind": "person",
//   "alias": "",
//   "description": "",
//   "site": "https://",
//   "email": "",
//   "twitter": "handle",
//   "instagram": "handle"
// }

const tezosProfileEndpoint = "https://api.tzprofiles.com/"

// the creator id is the minter of the tokens, and used to filter the tokens we want.
// tz1hJYLKMNffDWWamoXNNVSPXwAuNvVY9oii 
// is the address of the metacollector collection for thes alpha test

const query = `
query collectorGallery($address: String = "tz1VhN58tCJbboQQoyTgLWoCwDUXBidfcAgd", $fa2_id: String = "KT1QhxzQthAGa7Vcwj3WmegEorfAmR6F3hyq") {
  token_holder(where: {holder: {address: {_eq: $address}}, quantity: {_gt: "0"}, token: {fa_contract: {_eq: $fa2_id}}}) {
    quantity
    token {
      token_id
      metadata
      name
      supply
      artifact_uri
      attributes {
        attribute {
          name
          value
          type
        }
      }
    }
  }
}
`;

async function fetchGraphQL(operationsDoc, operationName, variables) {

    const result = await fetch(
        ojktcomIndexerEndpoint,
        {
            method: "POST",
            body: JSON.stringify({
                query: operationsDoc,
                variables: variables,
                operationName: operationName
            })
        }
    )
        .catch((error) => {
            console.log(error)
        });

    return await result.json();
}

async function fetchTokens(collectorAddress) {

    const { errors, data } = await fetchGraphQL(
        query,
        "collectorGallery",
        { "address": collectorAddress, "fa2_id": "KT1QhxzQthAGa7Vcwj3WmegEorfAmR6F3hyq" });
    if (errors) {
        console.error(errors);
    }

    const result = data.token_holder

    console.log(result)
    return result
}


async function fetchProfile(collectorAddress) {

    const tztkProfileEndpointFull = tztkProfileEndpointStart + collectorAddress + tztkProfileEndpointEnd

    return fetch(tztkProfileEndpointFull)

}

/////////////////// TOKEN AND METACOLLECTOR OBJECT PREPARATION  //////////////////////

// metacollector = {
//     walletAddress, // first 3 characters tz1 are always identical
//     iteration,
//     artfragments: [
//        {
//        image, // pi5js image object
//        name, // public name of the fragment, several fragments can have the same
//        attributes: { 
//                family,
//                size, // normalized [0, 1]
//                width, // calculated from image for convenience
//                height, // calculated from image for convenience
//                direction, // in radians [0, 6.28]
//                speed, // normalized [0, 1]
//                influence, // normalized [0, 1]
//                energy, //normalized [0, 1]
//                colors: ["#FFFFFF", "#3400FF", …], // 5 colors
//          }
//        },
//        {…}, // another fragment
//        {…}
//      ]
//     }


function parseTokens(tokens) {

    metacollector.artfragments = []; // clearing the local data

    console.log(tokens)

    if (tokens.length < 1) {
        noTokensToShow()
        return
    }

    document.getElementById('nofragment').style.display = "none"
    imageLoadingCountdown = tokens.length

    for (const thisToken of tokens) {

        let imageURL = thisToken.token.artifact_uri.replace("ipfs://", "https://ipfs.fleek.co/ipfs/") // using a public gateway. Later we could pin on our own gateway local to the web server to load them faster

        function parseAttributes(attributelist) {

            let flattenedObject = {}

            flattenedObject.colors = []

            for (obj of attributelist) {

                // console.log(obj.attribute)

                if (obj.attribute.name == "color") {

                    flattenedObject.colors.push(obj.attribute.value)
                }
                else if (obj.attribute.type == "number" || obj.attribute.type == "angle") {

                    flattenedObject[obj.attribute.name] = parseFloat(obj.attribute.value)
                }
                else {

                    flattenedObject[obj.attribute.name] = obj.attribute.value
                }
            }

            return flattenedObject
        }

        // console.log(thisToken.token.attributes)

        let parsedAttributes = parseAttributes(thisToken.token.attributes)

        let name = thisToken.token.name

        // console.log(parsedAttributes)

        loadImage(
            imageURL,
            (image) => {

                var ctx = collectionCanvas.getContext('2d');
                ctx.resetTransform()
                ctx.clearRect(0, 0, collectionCanvas.width, collectionCanvas.height)
                ctx.font = `${(collectionCanvas.width / 20)}px sans-serif`
                ctx.fillStyle = "white"
                ctx.textAlign = "center"
                ctx.fillText(`loading ${imageLoadingCountdown} images of fragments`, collectionCanvas.width / 2, collectionCanvas.height / 2)

                for (let i = 1; i <= thisToken.quantity; i++) {

                    let { ...attributes } = parsedAttributes // cloning the attributes

                    let widthToHeightRatio = image.width / image.height // ie. 16/9, 4/3

                    // set longest side of the image to size normalized value
                    // precompute the other side using the real image ratio
                    // longest side will always max to 1
                    if (image.width > image.height) {
                        attributes.width = attributes.size
                        attributes.height = attributes.size * widthToHeightRatio
                    }
                    else {
                        attributes.height = attributes.size
                        attributes.width = attributes.size / widthToHeightRatio
                    }

                    attributes.width = attributes.size
                    attributes.height = attributes.size * widthToHeightRatio

                    metacollector.artfragments.push({
                        name: name,
                        image: image,
                        attributes: attributes
                    })
                }

                imageLoadingCountdown--

                if (imageLoadingCountdown == 0) {
                    console.log("finished loading images")
                    ctx.clearRect(0, 0, collectionCanvas.width, collectionCanvas.height)
                    paintCollection(metacollector)
                }
            }
        );


    }
}
