# Twitch Shoutout (StreamElements)
This is a custom widget for Stream Elements which displays a visual shout-out when a moderator or the broadcaster invokes the command which includes the target's Twitch avatar.

## Installation
1. Log into StreamElements
1. Click `Streaming Tools` > `My Overlays` in the side menu
1. Open your existing overlay, or create a new one
1. Click the + symbol at the bottom of the page
1. Choose `Static / Custom` > `Custom Widget`
1. In the side bar that pops up, click `Open Editor`
1. In the HTML tab, replace everything in there with the contents of [the html file here](https://raw.githubusercontent.com/brofar/StreamElements-Shoutout/refs/heads/main/html.html).
1. In the CSS tab, replace everything in there with the contents of [the css file here](https://raw.githubusercontent.com/brofar/StreamElements-Shoutout/refs/heads/main/css.css).
1. In the JS tab, replace everything in there with the contents of [the js file here](https://raw.githubusercontent.com/brofar/StreamElements-Shoutout/refs/heads/main/js.js).
1. In the Fields tab, replace everything in there with the contents of [the fields file here](https://raw.githubusercontent.com/brofar/StreamElements-Shoutout/refs/heads/main/fields.json).
1. Click Done
1. Configure the shout out on the newly updated side bar.
1. Remember, as with any widget, edit the `Position, size and style` options to your liking.

## Notes
* Incorporates a queue in case multiple shoutouts are made in quick succession.
* You can use the `[name]` placeholder to indicate the streamer's name.
* The `[random]` placeholder picks from a list of random sayings (editable in the JS tab).


## Credits
A lot of credit to René Chiquete for creating the Shout Out widget that this is heavily based on: https://www.youtube.com/watch?v=zGFhhFit9WQ
