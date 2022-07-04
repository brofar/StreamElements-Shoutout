let config;

// Some global variables
let debugOutput = false;
let avatar_image = document.getElementById("avatar_image");
let text_main = document.getElementById("textMain");
let text_sub = document.getElementById("textSub");

let q = new Queue();

window.addEventListener('onWidgetLoad', async (obj) => {
  // Get the data from the StreamElements configuration fields
  config = obj.detail.fieldData;

  // Ready message, and also serves as a way to
  // Test the animation choice in the SE editor.
  if (config.showInit) {
    let blackPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEdSURBVHhe7cEBDQAAAMKg909tDjcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4EgNIBgAAVgJZJIAAAAASUVORK5CYII=";
    ShoutOut(blackPng, "Shout Out Loaded", "& ready to go.");
  }
});

// Listen for an event on Twitch
window.addEventListener('onEventReceived', async (obj) => {
  // If it's not a chat event, return.
  if (obj.detail.listener !== "message") return;

  // Extract data from the event
  let data = obj.detail.event.data;

  // If the user is the StreamElements bot, return.
  if (data["displayName"] == "StreamElements") return;

  let message = data["text"];
  let words = message.split(" ");

  // Command is the first argument of the text
  var command = words.shift();

  // Use badges to determine whether the user is a mod/broadcaster
  // without needing to pull the user object. The mod/broadcaster
  // badge will be in slot 1 (of a possible 3) of the user's badges.
  var badge1 = '';

  if (data["badges"][0]["type"])
    badge1 = data["badges"][0]["type"];

  let isMod = (badge1 === 'moderator');
  let isBroadcaster = (badge1 === 'broadcaster');
  let isModUp = isMod || isBroadcaster;

  if (command.toLowerCase() === config.customCommand && isModUp) {

    //iterate over all the targets
    console.log(`Received shoutout with ${words.length} target(s).`);
    for (var target of words) {
      debug(`Received command "${command}" with target "${target}".`);

      // Remove '@' from the name, in the case it was sent in that way from chat
      target = target.replace(/[@]/, '');

      // Add the target to the queue
      q.add(target);
    }

    // Brand spankin' new queue system to queue up
    // shout outs so they happen consecutively instead of 
    // overriding each other.
    if (!q.isBusy()) {
      q.setBusy(true);
      while (!q.isEmpty()) {
        debug(`Iterating Queue.`);
        // Do the shout out
        var streamer = q.first();
        await TwitchShoutOut(streamer);
      }
      q.setBusy(false);
    }
  }
});
async function TwitchShoutOut(username) {
  const name = username.toLowerCase();

  // Get the user's avatar
  var avatar = await GetAvatar(name);

  var TopText = ReplacePseudoVariables(config.shoutTopText, username);
  var BotText = ReplacePseudoVariables(config.shoutBotText, username);

  await ShoutOut(avatar, TopText, BotText);

  return Promise.resolve("success");
}
async function ShoutOut(imageUrl = null, TopText, BotText) {

  console.log('SHOUT OUT');

  // If an avatar was found...
  if (imageUrl) {
    //Play the video loaded in config
    if (config.shoutVideo !== null)
      playVideo(config.shoutVideo, config.shoutVideoVolume);

    //Play the sound loaded in config
    if (config.shoutAudio !== null)
      playAudio(config.shoutAudio, config.shoutAudioVolume);

    // Set the user's avatar into the img object
    SetImage(imageUrl, 100, config.shoutTop, config.shoutLeft);

    SetText(TopText, text_main);
    SetText(BotText, text_sub);

    // Animate In
    AnimateCSS(avatar_image, config.avatarEntranceClass, true);
    AnimateCSS(text_main, config.textTopEntranceClass, true);
    AnimateCSS(text_sub, config.textBotEntranceClass, true);

    await sleep(config.notificationTime * 1000);

    // Animate Out
    AnimateCSS(avatar_image, config.avatarExitClass);
    AnimateCSS(text_main, config.textTopExitClass);
    AnimateCSS(text_sub, config.textBotExitClass);
  }

  // Wait for the exit animation to complete.
  await sleep(2000);

  // Reset the element for the next time the command is used.
  ResetForNextRun();

  return Promise.resolve("success");
}

function SetText(text, element) {
  element.innerHTML = text;
}

// Replaces the pseudo variables in the
// user input with actual variables we use.
function ReplacePseudoVariables(text, target = "") {
  debug(`Doing pseudo variable replacement on ${text}.`);
  text = text.replace('[name]', target);
  text = text.replace('[random]', RandomMessage());

  return text;
}

function RandomMessage() {
  // Get the random messages from the user config.
  let randomText = config.randomText;
  // Turn the messages into an array, splitting by new line.
  let messages = randomText.split(/\r?\n/);
  return messages[Math.floor(Math.random() * messages.length)];
}

async function GetAvatar(username) {

  let baseAvatarUrl = `https://decapi.me/twitch/avatar/`;
  let res = await fetch(baseAvatarUrl + username).catch(console.warn);
  let avatar = await res.text();

  if (isValidHttpUrl(avatar)) {
    debug(`Got response from decapi, Avatar Found = ${avatar}.`);
    return avatar;
  }

  debug(`Avatar not found.`);
  return false;
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function SetImage(avatarURL, sizePercentage = 100, posFromTopPercentage = 0, posFromLeftPercentage = 0) {

  avatar_image.setAttribute("src", avatarURL);
  debug(`Image src is set.`);

  // Position the image virtically
  document.getElementById("main_container").style.top = posFromTopPercentage;
  document.getElementById("main_container").style.left = posFromLeftPercentage;

  // Set the image size
  avatar_image.style.height = sizePercentage + "%";
}

// Add an animation class to an element
function AnimateCSS(element, animationName, removeClassWhenDone = false) {
  debug(`Animating with ${animationName}.`);
  element.classList.add(animationName);

  if (removeClassWhenDone === true) {
    debug(`Added event listener for animation end.`);

    // Add a one-time event listener to remove the class once the animation completes.
    element.addEventListener("animationend", function () {
      removeClass(element, animationName);
    }, { once: true });
  }
}

function sleep(ms) {
  debug(`Sleeping for ${ms} ms.`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ResetForNextRun() {
  // Remove the avatar image
  avatar_image.setAttribute("src", '');

  // Empty the text strings
  text_main.innerHTML = '';
  text_sub.innerHTML = '';

  //Remove the animation classes
  removeClass(avatar_image);
  removeClass(text_main);
  removeClass(text_sub);
}

function removeClass(element, className = "all") {
  if (className == "all") {
    //Remove all classes
    element.className = '';
  } else {
    element.classList.remove(className);
  }
}

function playAudio(sound, volume) {
  debug(`Playing sound ${sound} at ${volume} volume.`);
  let audio = new Audio(sound);
  audio.volume = volume * .01;
  audio.play();
}

function playVideo(video, volume, size = 100) {
  debug(`Playing video ${video} at ${volume} volume.`);
  var vid = document.getElementById("vid");
  var soundVolume = volume;

  document.querySelector("video").setAttribute("src", video);
  document.querySelector("video").style.height = size + "%";
  document.querySelector("video").style.width = size + "%";

  vid.volume = soundVolume * .01;

  vid.play();
}

function debug(text) {
  if (debugOutput == true)
    console.log("DEBUG: " + text);
}

/* QUEUE */

function Queue() {
  this.data = [];
  this.busy = false;
}

Queue.prototype.isBusy = function () {
  return this.busy
}

Queue.prototype.setBusy = function (status) {
  this.busy = status;
}

Queue.prototype.add = function (record) {
  this.data.push(record);
}

Queue.prototype.remove = function () {
  this.data.shift();
}

Queue.prototype.first = function () {
  var first = this.data[0];
  this.remove();
  return first;
}

Queue.prototype.size = function () {
  return this.data.length;
}

Queue.prototype.isEmpty = function () {
  return this.data.length === 0;
}