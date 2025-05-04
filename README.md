# Anki_Simple-Image-Occlusion
Add-on for the Anki program. Create cards that hide part of the image and prompt the user to enter text for verification (if the sign is ?, otherwise the usual hiding).

When installing the add-on, the note type "Image Occlusion Simple (v1.0)" is created. Perhaps in other versions a note type with a different number in brackets will be added.

There is a special button to call the editor of closing rectangles on the background of the image (the cursor must be on the field with the image). The editor allows you to create regular rectangles to test your knowledge (yellow) and additional hiding ones (blue). It is possible to add a line to indicate a point on the picture. For complex cases, the rectangle can be rotated (right mouse button), converted to a circle (oval). The rectangle can have text (test word) and a hint for the word. Even if there is no hint, the user will still be shown the "?" sign so that he knows that this is an input field.

See the hotkeys in the tooltips for the buttons, for which move the cursor and hold it. The editor itself is made as a separate file "EditRectangle.html" in the add-on folder and you can easily open it with a browser and check how it works, look at the source code (in the file "EditRectangle.js")

After entering all the rectangles, you can click the save button and then the close button.

A copy of the entry can always be created for this entry or a separate entry can be created for each yellow rectangle. When viewing the card, you can change the scale (not ideal, especially for Android). Entering and checking words is simplified, that is, checking is done without taking into account the case of characters and many other signs (Android especially likes to make the first letter capital). If the word is written correctly, such a field will turn green. When entering, you can press the tab key to go to another field for the next entry (you can also press the "Enter" key to make it easier for Android). To simplify orientation, the next field blinks red several times.
