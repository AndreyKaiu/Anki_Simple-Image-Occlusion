# Anki_Simple-Image-Occlusion
Add-on for the Anki program. Create cards that hide part of the image and prompt the user to enter text for verification (if the sign is ?, otherwise the usual hiding).

**This is not the "Image Occlusion Enhanced" add-on!** See it here https://ankiweb.net/shared/info/1374772155


![Simple Image Occlusion_1](https://github.com/user-attachments/assets/85c76003-f81f-4e4a-8e84-1cc841ac5803)

![Simple Image Occlusion_2](https://github.com/user-attachments/assets/7d738941-42a0-4422-bbc5-d6fd92d7da7d)


This add-on is simpler in some ways, and not quite so in others. In any case, I needed the ability to enter text on the hiding rectangles themselves, to check such text.

When installing my add-on, the "Image Occlusion Simple (v1.0)" note type is created. Perhaps in other versions, a note type with a different number in brackets will be added.

There is a special button to call the editor of closing rectangles on the background of the image (the cursor must be on the field with the image). The editor allows you to create regular rectangles to test your knowledge (yellow) and additional hiding ones (blue). It is possible to add a line to indicate a point on the picture. For complex cases, the rectangle can be rotated (right mouse button), converted into a circle (oval). The rectangle can have text (test word) and a hint for the word. Even if there is no hint, the user will still be shown the "?" so that he knows that this is an input field.

See the hot keys in the tooltips for buttons, for which move the cursor and hold it. The editor itself is made as a separate file "EditRectangle.html" in the add-on folder and you can easily open it with a browser and check how it works, look at the source code (in the file "EditRectangle.js")

After entering all the rectangles, you can click the save button and then the close button.

You can always create another copy of the entry for this record or create a separate entry for each yellow rectangle. Then in such entries you can easily convert rectangles to the type you need.

When viewing a card, you can change the scale (not ideal, especially for Android). Entering and checking words is simplified, that is, checking is done without taking into account the case of characters and many other signs (Android especially likes to make the first letter capital). If the word is written correctly, such a field will turn green. When entering, you can press the tab key to move to another field for the next input (you can also press the "Enter" key to make it easier for Android). To simplify orientation, scroll to the next field and the field will blink red several times.

For ease of viewing of records, it is recommended to use the "Editor Live Preview" add-on https://ankiweb.net/shared/info/1960039667

The minimum possible code is added to the image field itself, and the main functionality can be changed in map templates and styles for the "Image Occlusion Simple (v1.0)" record type



**HELP AND SUPPORT**

**Please do not use reviews for bug reports or support requests.**<br>
**And be sure to like,** as your support is always needed. Thank you.
I don't get notified of your reviews, and properly troubleshooting an issue through them is nearly impossible. Instead, please either use the [issue tracker (preferred),](https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion/issues) add-on [support forums](https://forums.ankiweb.net), or just message me at [andreykaiu@gmail.com.](mailto:andreykaiu@gmail.com) Constructive feedback and suggestions are always welcome!

**VERSIONS**
- 1.0, date: 2025-05-04. First release

**SPECIAL THANKS**
- Thanks for helping with the development: chatgpt, GitHub.copilot - they helped more than hindered :), since I still had to delve into it myself and completely rework the code. But without them, I definitely would not have managed it, since I do not program in Python, and certainly not an Anki developer.

=========================
