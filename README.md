# Anki_Simple-Image-Occlusion
Add-on for the Anki program. Create cards that hide part of the image and prompt the user to enter text for verification (if the sign is ?, otherwise the usual hiding).

[**If you previously read everything below for versions 1.0 and 1.1, you can immediately jump to the description of version 1.2**](#version2)


**This is not the "Image Occlusion Enhanced" add-on!** See it here https://ankiweb.net/shared/info/1374772155


![Simple Image Occlusion_1](https://github.com/user-attachments/assets/85c76003-f81f-4e4a-8e84-1cc841ac5803)

![Simple Image Occlusion_2](https://github.com/user-attachments/assets/7d738941-42a0-4422-bbc5-d6fd92d7da7d)


This add-on is simpler in some ways, and not quite so in others. In any case, I needed the ability to enter text on the hiding rectangles themselves, to check such text.

When installing my add-on, the "Image Occlusion Simple (v1.1)" note type is created. Perhaps in other versions, a note type with a different number in brackets will be added.

Those who have previously installed the add-on may have version 1.0. The only difference with version 1.1 is in the card face template code, where the function of voicing the entered word by the voice engine is added when it is clicked (clicking again will allow you to enter the editing mode). If your voice language is not English, then find the line 'var langSS = "en-US";' in the card face template and replace it with your language. If you need to have different languages ​​for different cards, then create a separate field, say with the name "LngTag" and then write in the line: 'var langSS = "{{LngTag}}";'

There is a special button to call the editor of closing rectangles on the background of the image (the cursor must be on the field with the image). The editor allows you to create regular rectangles to test your knowledge (yellow) and additional hiding ones (blue). It is possible to add a line to indicate a point on the picture. For complex cases, the rectangle can be rotated (right mouse button), converted into a circle (oval). The rectangle can have text (test word) and a hint for the word. Even if there is no hint, the user will still be shown the "?" so that he knows that this is an input field.

See the hot keys in the tooltips for buttons, for which move the cursor and hold it. The editor itself is made as a separate file "EditRectangle.html" in the add-on folder and you can easily open it with a browser and check how it works, look at the source code (in the file "EditRectangle.js")

After entering all the rectangles, you can click the save button and then the close button.

You can always create another copy of the entry for this record or create a separate entry for each yellow rectangle. Then in such entries you can easily convert rectangles to the type you need.

When viewing a card, you can change the scale (not ideal, especially for Android). Entering and checking words is simplified, that is, checking is done without taking into account the case of characters and many other signs (Android especially likes to make the first letter capital). If the word is written correctly, such a field will turn green. When entering, you can press the tab key to move to another field for the next input (you can also press the "Enter" key to make it easier for Android). To simplify orientation, scroll to the next field and the field will blink red several times.

For ease of viewing of records, it is recommended to use the "Editor Live Preview (Fixed by Shigeඞ)" add-on [https://ankiweb.net/shared/info/1960039667](https://ankiweb.net/shared/info/90407377)

The minimum possible code is added to the image field itself, and the main functionality can be changed in map templates and styles for the "Image Occlusion Simple (v1.1)" record type

![Simple Image Occlusion_3](https://github.com/user-attachments/assets/18b212c8-eb93-48f5-9bc5-37e2d50796b0)

Version 1.1.2 from December 27, 2025. The note type hasn't changed; it remains "Image Occlusion Simple (v1.1)" and working with your decks remains the same.

Since activating the add-on via the "Add New Note" button could cause an error if users immediately wanted to create an occlusion, we had to modify the algorithm. Initially, we assumed we already had notes with images and were using them to create occlusions. But since many people find it more convenient to immediately add a new note using the "Add" button, insert an image, and apply occlusion, I've changed the algorithm: you click the "Add" button, select the "Image Occlusion Simple (v1.1)" note type, choose a deck, insert an image, and if you later want to create new notes of the "Image Occlusion Simple (v1.1)" type, since one note has already been added, it won't be counted when creating new notes, and you must click the "Add" (save) button yourself. Then, check how many notes you've created and what's in them. If you select a note type other than "Image Occlusion Simple (v1.1)" after clicking the "Add" button, the full number of "Image Occlusion Simple (v1.1)" notes will be created when you create new notes using this add-on, as this wasn't the case previously.

I haven't changed the algorithm for saving edited data. I just added a "Save and Close" field to prevent double-clicking.

When creating rectangles in the addon, people wouldn't always release the mouse button on the image itself, which could cause an error. To eliminate this error, the created rectangles are now a different color and have a dotted line. A gray border has been added to the image to prevent confusion. A little white space has been added to the bottom of the image, as there were issues accessing the bottom of the image when the buttons were stacked in two rows.

Creating hidden rectangles:

<img width="1281" height="940" alt="SIOv2_3" src="https://github.com/user-attachments/assets/f4936f8e-13c0-441b-89f7-32204f43c2e2" />

Not much has changed. Everything is almost the same. However, you can now select a version (it automatically detects based on the type you selected, provided you previously installed the add-on). You can now specify the direction for selecting the next rectangle when filling when pressing 'Tab' (or 'Enter'). The problem is that in documents and texts, the transition to the next occlusion should be horizontal, but in some drawings it's vertical, by column.

A button for selecting a selection area has been added to the image itself. Operations now work on groups of elements. There are also undo and redo commands. Each button has a tooltip describing what it can do and the hotkeys it uses.

Since we sometimes had to view documents with very small print (usually instructions), a 200% zoom button was needed for convenience. This helps with eye strain, so the hotkey [F1] was chosen.

The line was replaced with an arrow, but the direction was reversed, since it is easier to click from an unoccupied point and connect it to a rectangle that already occupies some area of ​​the drawing (although I am more used to dragging the line from left to right).

The line can also be dotted. This is an invisible line. Sometimes drawings already have lines, and there may be more than one leading to the caption. So, unnecessary clutter with lines is unnecessary. For good memorization, it's important to click on the correct point in the drawing (this is the starting point of the arrow, i.e., its sharp end) so that the caption is activated.

You can now change some colors in the ":root" section of the card type's CSS, but sometimes red helps when you need to draw attention to something. In this note type, you can label the rectangle so that the hint begins with an exclamation point '::!'—this will cause the rectangle to be framed in red, drawing our attention to it first. This is sometimes necessary when certain pieces of information are difficult to remember or are crucial and must be checked first (what's the point of remembering the 10 words of a safe password if you can't remember where the safe itself is?).

Note that when selecting rectangles, you can now hold down Alt to draw a shape from the center, hold down Shift to create a precise square (circle), and hold down Ctrl to increment the shape. When rotating (right-click on a point on the rectangle's border), try holding these keys as well. And when moving, Shift will help you maintain horizontal or vertical alignment.




=============================================

<span id="version2"></span>
**Version 2, May 9, 2026**

Even without installing the add-on, you can evaluate its performance by following [the link: https://andreykaiu.github.io/Anki_Simple-Image-Occlusion/Seas%20(6th%20Grade).html](https://andreykaiu.github.io/Anki_Simple-Image-Occlusion/Seas%20(6th%20Grade).html)

<img width="912" height="793" alt="Seas 6_1" src="https://github.com/user-attachments/assets/d458140b-3523-40da-add9-9bb385b24616" />

Click the "Game" button to start the game. You must click on the yellow rectangles that hide (or indicate) the object you're looking for. Once you quickly (within 1-2 seconds) find the object, an additional "Next" button will become available. Click this button to open a new page with a different game or, as in this case, to display the quiz assessment form.

The interface may be displayed in the language configured in your browser. If you complete this short game very well, it's a good idea to include your country in addition to your name when filling out the survey, as I'd like to know the preferred target languages.

The example above shows a card with a complex fill-in task, not a simple hiding task. However, this type of filling allows you to both pronounce the words (depending on your system's TTS) and play a speed game, since only instant recall demonstrates your excellent memorization. As a reward for excellent performance, you might be shown a link that could lead to a higher level or somewhere else, even to a website where you might relax (you can set this yourself, or your teacher can send you ready-made cards for viewing outside of Anki).

If a card is being shown to many people in the audience and something needs to be explained, demonstrated, or emphasized, then you can turn on the pointer mode (you can enter all the words at once if this information is needed).

<img width="838" height="730" alt="Seas 6_2" src="https://github.com/user-attachments/assets/16f0ccfb-4cfe-4b83-81a8-1180a78d179a" />

To clarify the action of a key, you need to hover the mouse pointer over it and wait for the tooltip to appear.

The "Export to HTML" button is available to the user, either in the HTML file itself or only on the ankiuser.net website. If only certain words are difficult for you, you can hide others and leave only the difficult ones. Then, by clicking "Export to HTML," you'll get a file that, when uploaded, will immediately show you what you need to pay attention to when memorizing.

Anki only allows you to copy the HTML code for such a file; you must create a blank file with UTF8 encoding yourself. Currently, there are difficulties creating a file from Anki when embedding a large audio file (over 2 megabytes). However, since this functionality (exporting to HTML) is rarely needed and is primarily for teachers, most users will not experience any issues.

After you install this add-on for your Anki program (computer version only), you can create new cards as before, but here the following fields have been added:

<img width="1213" height="903" alt="SIOv2_1" src="https://github.com/user-attachments/assets/e125f921-2de9-41b0-921a-dcf228ab080b" />

When adding a card, select the 'Image Occlusion Simple (v2)' type. If you previously installed this add-on, you can create a card using the older type.

It's important to fill in the 'Front' field as always, pasting a cut-out portion of the screen from the clipboard that displays the desired PDF page or something else. You can draw the desired rectangles by clicking the special button (circled in red).

The 'Header' field is essential, as it's easier to navigate by the title. Typically, it might contain the title of the book or PDF file, with a link to it in the field below. However, the link doesn't necessarily have to be to a PDF; you might want to link to a regular website.

The 'Words' field is automatically filled in when something is written in the rectangles and is primarily used to search for cards with a specific word.

The 'LngTag' field can be left blank if the language is English, or it can have a hyphen if TTS is not needed. Well, and maybe a TTS settings entry, as described in the Anki help.

<img width="862" height="678" alt="SIOv2_2" src="https://github.com/user-attachments/assets/a28db55b-0c84-4c3e-8dac-636e0f87ed59" />

An audio file can be added to the card (in the 'AudioFile' field). This makes sense when the card only has one rectangle and it makes sense to add some audio to it.

Anything that needs to be added to the front of the card should be written in the 'Front Extra' field. For the back of the card, you can write in the other two fields. Just don't fill out the 'Comments' field right away; it's best to fill it out for each user individually. But if you're making the card for yourself, you can, of course, fill it out however you like.

The last field, 'URLVictory', is only needed for a game. You might want to include links there to another website or to another similar card that can be completed after this one.







**HELP AND SUPPORT**

**Please do not use reviews for bug reports or support requests.**<br>
**And be sure to like,** as your support is always needed. Thank you.
I don't get notified of your reviews, and properly troubleshooting an issue through them is nearly impossible. Instead, please either use the [issue tracker (preferred),](https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion/issues) add-on [support forums](https://forums.ankiweb.net/t/add-ons-simple-image-occlusion-official-support/60307), or just message me at [andreykaiu@gmail.com.](mailto:andreykaiu@gmail.com) Constructive feedback and suggestions are always welcome!

**VERSIONS**
- 2.0, date: 2026-05-09. There are many changes in the "Image Occlusion Simple (v2)" version. Many fields have been added to make it easier to transfer data from the standard "Image Occlusion" type. The add-on code has been modified to allow creation of both the old and new "Image Occlusion Simple" types.
- 1.1.2, date: 2025-12-27. The note type version hasn't changed. Added a "Save and Close" button. Renamed the Create button to "Create New." Notes of the "Image Occlusion Simple (v1.1)" type are now always created. Fixed a bug with adding a new note and immediately creating it using the addon. Some design changes have been made to rectangles that have not yet been created but are indicated by a border. 
- 1.1.1, date: 2025-10-12. Fixed a button display issue when viewing on ankiweb.net. The note type version hasn't changed, but you'll need to agree to change the template code (save your design first if you changed the default for "Image Occlusion Simple (v1.1)").
- 1.1, date: 2025-09-02. The only difference with version 1.0 is in the card face template code, where the function of voicing the entered word by the voice engine when it is clicked is added (clicking again will allow you to enter the editing mode). Thanks to all those 500 who downloaded it. This version was made especially for this event. If you have any problems or suggestions, write to the forum, maybe I'll implement it if I have some free time.
- 1.0.1, date: 2025-06-05. The note_type folder has been added. What does this mean? That no one has checked it before, but I had this type of record and the error was not detected :(
- 1.0, date: 2025-05-04. First release

**SPECIAL THANKS**
- Thanks for helping with the development: chatgpt, GitHub.copilot - they helped more than hindered :), since I still had to delve into it myself and completely rework the code. But without them, I definitely would not have managed it, since I do not program in Python, and certainly not an Anki developer.

=========================
