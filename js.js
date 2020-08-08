// Variables to represent StreamElements' pseudovariables
const notificationTime = {notificationTime};
const customCommand = '{customCommand}';

// SE Media variables
const videoFile = "{shoutVideo}";
const videoVolume = {shoutVideoVolume};
const soundFile = "{shoutAudio}";
const soundVolume = {shoutAudioVolume};

// SE Text variables
const shoutTopText = "{shoutTopText}";
const shoutBotText = "{shoutBotText}";

// SE CSS class name variables
const avatarEntranceClass =  "{avatarEntranceClass}";
const avatarExitClass = "{avatarExitClass}";
const textTopEntranceClass = "{textTopEntranceClass}";
const textTopExitClass = "{textTopExitClass}";
const textBotEntranceClass = "{textBotEntranceClass}";
const textBotExitClass = "{textBotExitClass}";

// Some global variables
let debugOutput = false;
let shoutoutDuration = notificationTime * 1000;
let service = "twitch";
let avatar_image = document.getElementById("avatar_image");
let text_main = document.getElementById("textMain");
let text_sub = document.getElementById("textSub");

let q = new Queue();

let messages = ["Probably a decent human.",
  "A featherless biped.",
  "Cleans up well.",
  "This one is good.",
  "Probably not a cannibal.",
  "Has so much potential.",
  "Cute.",
  "Better than bubble wrap.",
  "Has a smile",
  "Inspiring",
  "A gift to Twitch",
  "A great parent",
  "Their aura is strong."
];

window.addEventListener('onWidgetLoad', async (obj) => {
  // Ready message, and also serves as a way to
  // Test the animation choice in the SE editor.
  let blackPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAIAAAD2HxkiAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEdSURBVHhe7cEBDQAAAMKg909tDjcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4EgNIBgAAVgJZJIAAAAASUVORK5CYII=";
  ShoutOut(blackPng, "Shout Out Loaded", "& ready to go.");
});

// Listen for an event on Twitch
window.addEventListener('onEventReceived', async (obj) => {
  // Event listener code used from René Chiquete's Awesome Shoutouts 1.3.
  // https://www.youtube.com/watch?v=zGFhhFit9WQ

  // If it's not a chat event, return.
  if (obj.detail.listener !== "message") return;

  // Extract data from the event
  let data = obj.detail.event.data;

  // If the user is the StreamElements bot, return.
  if (data["displayName"] == "StreamElements") return;

  // Command is the first argument of the text, and
  // the shout out name is the second argument of the text
  let message = data["text"];
  var command = message.split(" ")[0];
  var target = message.split(" ")[1];

  // Use badges to determine whether the user is a mod/broadcaster
  // without needing to pull the user object. The mod/broadcaster
  // badge will be in slot 1 (of a possible 3) of the user's badges.
  var badge1 = '';

  if (data["badges"][0]["type"])
    badge1 = data["badges"][0]["type"];

  let isMod = (badge1 === 'moderator');
  let isBroadcaster = (badge1 === 'broadcaster');
  let isModUp = isMod || isBroadcaster;

  if (command.toLowerCase() === customCommand && isModUp) {

    debug(`Received command "${command}" with target "${target}".`);

    // Remove '@' from the name, in the case it was sent in that way from chat
    target = target.replace(/[@]/, '');

    // Add the target to the queue
    q.add(target);

    // Brand spankin' new queue system to queue up
    // shout outs so they happen consecutively instead of 
    // overriding each other.
    if(!q.isBusy()) {
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
  var avatar = GetAvatar(name);

  var TopText = ReplacePseudoVariables(topString, username);
  var BotText = ReplacePseudoVariables(botString, username);

  await ShoutOut(avatar, TopText, BotText);
  
  return Promise.resolve("success");
}
async function ShoutOut(imageUrl = null, TopText = shoutTopText, BotText = shoutBotText) {

  // If an avatar was found...
  if (imageUrl) {
    //Play the video loaded in config
    if (videoFile !== null)
      playVideo(videoFile, videoVolume);

    //Play the sound loaded in config
    if (soundFile !== null)
      playAudio(soundFile, soundVolume);

    // Set the user's avatar into the img object
    SetImage(imageUrl);

    SetText(TopText, text_main);
    SetText(BotText, text_sub);

    // Animate In
    AnimateCSS(avatar_image, avatarEntranceClass, true);
    AnimateCSS(text_main, textTopEntranceClass, true);
    AnimateCSS(text_sub, textBotEntranceClass, true);

    await sleep(shoutoutDuration);

    // Animate Out
    AnimateCSS(avatar_image, avatarExitClass);
    AnimateCSS(text_main, textTopExitClass);
    AnimateCSS(text_sub, textBotExitClass);
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
  return messages[Math.floor(Math.random() * messages.length)];
}

function GetAvatar(username) {
  var data = null;
  var xhr = new XMLHttpRequest();
  let result = false;

  // Open remote web request to decapi.me to pull Twitch avatar
  xhr.open("GET", "https://decapi.me/twitch/avatar/" + username, false);
  xhr.setRequestHeader("accept", "application/json");
  xhr.send(data);

  if (xhr.status == 400 || xhr.status == 404) {
    return;
  }
  if (xhr.status == 200) {
    let avatarFound = !(xhr.responseText.includes("User not found") || xhr.responseText.includes("No user with the name"));

    debug(`Got response from decapi, Avatar Found = ${avatarFound}.`);

    if (avatarFound) {
      debug(`Got avatar: ${xhr.responseText}`);

      return xhr.responseText;
    } else {
      debug(`Avatar not found. Response from server: ${xhr.responseText}`);
      return false;
    }
  } else {
    return false;
  }
}

function SetImage(avatarURL, sizePercentage = 100, posFromTopPercentage = 0) {

  avatar_image.setAttribute("src", avatarURL);
  debug(`Image src is set.`);

  // Position the image virtically
  //document.getElementById("main_container").style.top = posFromTopPercentage + "%"

  // Set the image size
  avatar_image.style.height = sizePercentage + "%";
}

// Add an animation class to an element
function AnimateCSS(element, animationName, removeClassWhenDone = false) {
  debug(`Animating with ${animationName}.`);
  element.classList.add(animationName);
  
  if(removeClassWhenDone === true) {
   debug(`Added event listener for animation end.`);

   // Add a one-time event listener to remove the class once the animation completes.
   element.addEventListener("animationend", function() {
     removeClass(element, animationName);
   }, {once : true});
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

function removeClass(element, className="all") {
  if(className == "all") {
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
