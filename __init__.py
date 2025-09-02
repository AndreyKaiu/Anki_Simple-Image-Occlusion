# -*- coding: utf-8 -*-
# Simple Image Occlusion
# https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion
# Version 1.1, date: 2025-09-02
from aqt.qt import *
from aqt.editor import Editor
from aqt.browser.browser import Browser
from aqt import gui_hooks
from aqt.utils import showInfo
from pathlib import Path
import re
import os
import shutil
import time
from aqt.addcards import AddCards

from aqt import mw
import anki.lang
from aqt.utils import (showText, showInfo, tooltip) 
from bs4 import BeautifulSoup
# from aqt.gui_hooks import collection_did_load
from aqt.gui_hooks import profile_did_open

from anki.consts import MODEL_STD

try:
    from PyQt6.QtWidgets import QApplication, QVBoxLayout, QDialog, QMessageBox, QMainWindow     
    from PyQt6.QtWebEngineWidgets import QWebEngineView
    from PyQt6.QtCore import Qt, QObject, QTimer, QRegularExpression, QUrl
    from PyQt6.QtWebChannel import QWebChannel
    pyqt_version = "PyQt6"
except ImportError:
    from PyQt5.QtWidgets import QApplication, QVBoxLayout, QDialog, QMessageBox, QMainWindow     
    from PyQt5.QtWebEngineWidgets import QWebEngineView
    from PyQt5.QtCore import Qt, QObject, QTimer, QRegExp, QUrl
    from PyQt5.QtWebChannel import QWebChannel   
    pyqt_version = "PyQt5"


# ========================= CONFIG ============================================
# Loading the add-on configuration
config = mw.addonManager.getConfig(__name__)
meta  = mw.addonManager.addon_meta(__name__)
this_addon_provided_name = meta.provided_name

def configF(par1, par2, default=""):
    """get data from config"""
    try:
        ret = config[par1][par2]
        return ret
    except Exception as e:        
        print("logError: ", e)
        return default     

languageName = configF("GLOBAL_SETTINGS", "language", "en")
current_language = anki.lang.current_lang #en, pr-BR, en-GB, ru and the like
if not languageName: # if you need auto-detection     
    languageName = current_language
    if languageName not in config["LOCALIZATION"]:        
        languageName = "en" # If it is not supported, we roll back to English               
    
try:
    localization = config["LOCALIZATION"][languageName]
except Exception as e:
    text = f"ERROR in add-on '{this_addon_provided_name}'\n"
    text += f"Config[\"GLOBAL_SETTINGS\"][\"language\"] does not contain '{languageName}'"
    text += "\nChange the add-on configuration, \"language\": \"en\""
    languageName = "en"
    config["GLOBAL_SETTINGS"]["language"] = languageName # change language
    mw.addonManager.writeConfig(__name__, config) # write the config with changes
    showText(text, type="error")

def localizationF(par1, default=""):
    """get data from localization = config["LOCALIZATION"][languageName] """
    try:
        ret = localization[par1]
        return ret
    except Exception as e:        
        print("logError: ", e)
        return default  
# =============================================================================


dialog = None
idxcurrentField = 0
single_card_radio = None
browserS = None


def browser_show(browser):
    global browserS
    browserS = browser 


def user_consent(text, title):
    """user poll function yes/no"""
    msg_box = QMessageBox()
    msg_box.setIcon(QMessageBox.Icon.Question)
    msg_box.setText(text)
    msg_box.setWindowTitle(title)
    msg_box.setStandardButtons(QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No) 
    return msg_box.exec() == QMessageBox.StandardButton.Yes 


def show_image_dialog(self):
    global single_card_radio 
    global idxcurrentField
    global dialog
    img_field = None
    img_path = None
    content = None
    idx = getattr(self, "currentField", None)
    idxcurrentField = idx

    if idx is None:
        locF = localizationF("Unable_to_determine_active_field", "Unable to determine active field.")
        showInfo(locF)
        return

    # Get the field name by index
    field_names = list(self.note.keys())
    if idx < 0 or idx >= len(field_names):
        locF = localizationF("Invalid_field_index", "Invalid field index.")
        showInfo(locF)
        return
    field = field_names[idx]

    # We are looking for <img> in this field
    content = self.note[field]
    m = re.search(r'<img[^>]+src=["\'](.*?)["\']', content)
    if not m:
        locF = localizationF("There_are_no_images_in_the_field", "There are no images in the field {field}")
        showInfo(f"{locF}.")
        return

    img_field = field
    img_path = m.group(1).split("?")[0]    
    collection = self.note.col
    media_dir = collection.media.dir()
    full_path = os.path.join(media_dir, img_path)

    if not os.path.exists(full_path):
        locF = localizationF("Image_not_found", "Image not found")
        showInfo(f"{locF}: {full_path}")
        return

    # Loading HTML code from a file EditRectangle.html
    addon_dir = os.path.dirname(__file__)
    html_file_path = os.path.join(addon_dir, "EditRectangle.html")
    if not os.path.exists(html_file_path):
        locF = localizationF("HTML_file_not_found", "HTML file not found")
        showInfo(f"{locF}: {html_file_path}")
        return

    with open(html_file_path, "r", encoding="utf-8") as html_file:
        html_content = html_file.read()
    

    

    html_content = html_content.replace(
        '<img src="test.jpg" class="sio-image">',
        f'<img src="{img_path}" class="sio-image">'
    )
   
    html_field = self.note[img_field] # get HTML in the field
    rectangles_html = transform_html(html_field)
    if rectangles_html:
        html_content = html_content.replace(
            f'<img src="{img_path}" class="sio-image">',
            f'<img src="{img_path}" class="sio-image">\n{rectangles_html}'
        )


    # Embed JavaScript content directly into HTML
    js_file_path = os.path.join(addon_dir, "EditRectangle.js")
    if os.path.exists(js_file_path):
        with open(js_file_path, "r", encoding="utf-8") as js_file:
            js_content = js_file.read()
        html_content = html_content.replace(
            '<script src="EditRectangle.js"></script>',
            f'<script>{js_content}</script>'
        )
    else:
        locF = localizationF("HTML_file_not_found", "JavaScript file not found")
        showInfo(f"{locF}: {js_file_path}")
        return
    
    

    # Create a window to display HTML
    dialog = QDialog(self.widget)
    locF = localizationF("Simple_image_occlusion", "Simple image occlusion")
    dialog.setWindowTitle(locF)
    if pyqt_version == "PyQt6":
        dialog.setWindowFlag(dialog.windowFlags() | Qt.WindowType.WindowMaximizeButtonHint)
    else:
        dialog.setWindowFlag(Qt.WindowMaximizeButtonHint)
    dialog.setMinimumSize(800, 600)  # Set the minimum window size
    
    web_view = QWebEngineView() 
    media_path = os.path.join(mw.pm.profileFolder(), "collection.media") + "/"
    media_url = QUrl.fromLocalFile(media_path)        
    web_view.setHtml(html_content, media_url ) 
    layout = QVBoxLayout()
    layout.addWidget(web_view)
    

    # Option to choose between single card or multiple cards
    card_option_layout = QHBoxLayout()
    create_button = QPushButton(localizationF("Create", "Create"))
    create_button.clicked.connect(lambda: createNotes(self, web_view, img_field))
    card_option_layout.addWidget(create_button)

    locF = localizationF("Card_Options", "Card Options:")
    card_option_label = QLabel(locF)
    card_option_layout.addWidget(card_option_label)

    locF = localizationF("Card_for_all_rectangles","1 Card for all rectangles")
    single_card_radio = QRadioButton(locF)
    single_card_radio.setChecked(True)
    locF = localizationF("Card_per_rectangle","1 Card per rectangle")
    multi_card_radio = QRadioButton(locF)

    card_option_group = QButtonGroup()
    card_option_group.addButton(single_card_radio)
    card_option_group.addButton(multi_card_radio)
    card_option_layout.addWidget(single_card_radio)
    card_option_layout.addWidget(multi_card_radio)
    layout.addLayout(card_option_layout)


    button_layout = QHBoxLayout()    
    # Adding a save button
    locF = localizationF("Save","💾 Save")    
    save_button = QPushButton(locF)
    save_button.clicked.connect(lambda: save(self, web_view, img_field))
      
    button_layout.addWidget(save_button)

    # Adding a close button    
    close_button = QPushButton(localizationF("Close", "Close"))
    close_button.clicked.connect(dialog.close)
    button_layout.addWidget(close_button)
    layout.addLayout(button_layout)

    dialog.setLayout(layout)    
    dialog.unsetCursor() # cursor as in HTML    
    dialog.exec()    


def setup_image_button(buttons, editor):
    locF = localizationF("Simple_image_occlusion", "Simple image occlusion")
    image_button = editor.addButton(
        icon=None,
        cmd="Simple_image_occlusion",        
        func=lambda selfEditor=editor: QTimer.singleShot(0, lambda: show_image_dialog(selfEditor)),
        tip=locF,        
        label='''
        <div style="position: relative; width: 20px; height: 20px; display: inline-block; text-align: center; line-height: 20px; font-size: 12px;">
            🖼️
            <div style="position: absolute; width: 9px; height: 9px; background-color: yellow; top: 1px; left: 1px; border: 1px solid black;"></div>
            <div style="position: absolute; width: 9px; height: 9px; background-color: blue; bottom: 1px; right: 1px; border: 1px solid black;"></div>
        </div>
        '''
    )
    buttons.append(image_button)
    return buttons



def transform_html(html_field):
    """Converts HTML for further editing"""
    soup = BeautifulSoup(html_field, 'html.parser')

    # Find all divs with class sio-rect
    sio_rects = soup.find_all('div', class_='sio-rect')
    if not sio_rects:
        return ''  # If there are no such divs, return an empty string

    rectangles_html = []

    for rect in sio_rects:
        # Extract the styles left, top, width, height
        style = rect.get('style', '')
        filtered_style = ' '.join(
            match.group(0) for match in re.finditer(r'(left|top|width|height|transform):[^;]+;', style)
        )        
        # Extracting word, hint and data-hiding attributes
        word = rect.get('word', '')
        hint = rect.get('hint', '')
        
        line = ' line' if 'line' in rect.get('class', []) else ''        
        round = ' round' if 'round' in rect.get('class', []) else ''
        hiding = ' hiding' if 'hiding' in rect.get('class', []) else ''

        # Forming the contents of txt-rectangle
        txt_content = word
        if hint:
            txt_content += f"::{hint}"

        # Forming div class="sio-rect"
        rectangle_html = f'''
<div class="sio-rect{hiding}{round}{line}" style="{filtered_style}" >
    <div class="txt-sio-rect" contenteditable="true">{txt_content}</div>
    <div class="resize-handle nw"></div>
    <div class="resize-handle ne"></div>
    <div class="resize-handle sw"></div>
    <div class="resize-handle se"></div>
</div>
'''
        rectangles_html.append(rectangle_html)

    # Combine all div class="sio-rect" into one HTML
    return '\n'.join(rectangles_html)



def process_html(html_content):
    """Parses HTML and returns minified HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    # We extract <img>
    img_tag = soup.find('img')
    img_src = img_tag['src'] if img_tag else ''

    # We extract <div class="sio-rect">
    rectangles = []
    for rect in soup.find_all('div', class_='sio-rect'):
        style = rect.get('style', '')
        # Extract left and top values for sorting
        left = 0
        top = 0
        for match in re.finditer(r'(left|top):([^;]+);', style):
            if match.group(1) == 'left':
                left = float(match.group(2).strip('%'))  # Convert percentage to float
            elif match.group(1) == 'top':
                top = float(match.group(2).strip('%'))  # Convert percentage to float

        # We leave only the parameters left, top, width, height, transform 
        filtered_style = ' '.join(
            match.group(0) for match in re.finditer(r'(left|top|width|height|transform):[^;]+;', style)
        )                       
       
        txt_rectangle = rect.find('div', class_='txt-sio-rect')
        word, hint = '', ''
        if txt_rectangle and txt_rectangle.string:
            text = txt_rectangle.string.strip()
            if '::' in text:
                word, hint = text.split('::', 1)
            else:
                word = text
        
        line = ' line' if 'line' in rect.get('class', []) else ''        
        round = ' round' if 'round' in rect.get('class', []) else ''
        hiding = ' hiding' if 'hiding' in rect.get('class', []) else ''
        contenteditable = 'contenteditable="false"' if hiding else 'contenteditable="true"'
        # Append rectangle data with position for sorting
        rectangles.append({
            'html': f'<div class="sio-rect{hiding}{round}{line}" style="{filtered_style}" word="{word}" hint="{hint}"></div>',
            'left': left,
            'top': top
        })

    # Sort rectangles by top, then by left
    rectangles.sort(key=lambda r: (r['top'], r['left']))

    # Assemble the final HTML
    rects_html = '\n'.join(rect['html'] for rect in rectangles)
    final_html = f'<img src="{img_src}" class="sio-image">\n{rects_html}'
    return final_html



def get_modified_html(web_view, callback):
    """Gets the modified HTML from QWebEngineView and processes it"""
    def internal_callback(html):
        processed_html = process_html(html)        
        callback(processed_html)
    web_view.page().toHtml(internal_callback)



def save(editor, web_view, img_field):
    def on_html_processed(html_content):
        if not html_content:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Save...</p>")
            return
        if not isinstance(html_content, str):
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Type html_content...</p>")
            return
        if not editor.note:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Note not initialized...</p>")
            return

        editor.note[img_field] = html_content
        if editor.note.id != 0:
            editor.note.flush()
        editor.loadNoteKeepingFocus()

        locF = localizationF("Saved", "Saved")
        tooltip(f"<p style='color: yellow; background-color: black'>{locF}</p>")

    # We pass the handler to get_modified_html
    get_modified_html(web_view, on_html_processed)


def RefreshDeck_id(editor, deck_id):  
    """update the type of column maps"""     
    deck_name = browserS.mw.col.decks.name(deck_id)
    if Browser and deck_name:        
        browserS.sidebar.update_search(f'"deck:{deck_name}"')


def create(editor, web_view, img_field):
    def on_html_processed(html_content):
        if not html_content:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Save...</p>")
            return
        if not isinstance(html_content, str):
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Type html_content...</p>")
            return
        if not editor.note:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Note not initialized...</p>")
            return

        # Find the note type and deck
        # model = editor.note.model()
        note_type = editor.note.note_type()
        deck_id = editor.note.cards()[0].did if editor.note.cards() else editor.mw.col.decks.selected()
        crN = 0
        # Create one new with full html_content
        if single_card_radio.isChecked():            
            new_note = editor.mw.col.new_note(note_type) #model)
            # Copy values from original note to maintain consistency
            for field_name in editor.note.keys():
                if field_name == img_field:
                    new_note[field_name] = html_content
                else:
                    new_note[field_name] = editor.note[field_name]

            # Add the note to the collection
            editor.mw.col.add_note(new_note, deck_id)
            crN += 1            

        else:  # Otherwise, it is necessary to create for each class Sio-Rect (but not for Line or Hiding)            
            soup = BeautifulSoup(html_content, 'html.parser')
            sio_rects = soup.find_all('div', class_='sio-rect')
            # We filter the elements, excluding those that have a class "line" or "hiding"
            valid_rects = [rect for rect in sio_rects if 'line' not in rect.get('class', []) and 'hiding' not in rect.get('class', [])]
            # Create a new entry for each Valid_rect
            for current_rect in valid_rects:                
                new_soup = BeautifulSoup(str(soup), 'html.parser') # Copy HTML for a new entry                
                for rect in new_soup.find_all('div', class_='sio-rect'): # We process everything <div class = "sio-rect"> in the new entry
                    if rect != current_rect:                        
                        rect['class'] = rect.get('class', []) + ['hiding'] # Add the class "hiding" for all elements, except for the current                
                new_html_content = str(new_soup) # We convert HTML back into the line               
                new_note = editor.mw.col.new_note(note_type) # Create a new record
                
                for field_name in editor.note.keys():
                    if field_name == img_field:
                        new_note[field_name] = new_html_content
                    else:
                        new_note[field_name] = editor.note[field_name]

                # Add the note to the collection
                editor.mw.col.add_note(new_note, deck_id)
                crN += 1

        locF = localizationF("Created_notes","Created notes:")        
        tooltip(f"<p style='color: yellow; background-color: black'>{locF} {crN}</p>")
        QTimer.singleShot(500, lambda:RefreshDeck_id(editor, deck_id))

    # We pass the handler to get_modified_html
    get_modified_html(web_view, on_html_processed)


def createNotes(editor, web_view, img_field):
    global single_card_radio 
    global dialog
    if single_card_radio:
        title = localizationF("Question", "Question")
        text = localizationF("want_to_create", "Are you sure you want to create")
        if single_card_radio.isChecked():            
            text += " «" + localizationF("Card_for_all_rectangles", "One note for everything") + "»?" 
        else:
            text += " «" + localizationF("Card_per_rectangle", "Lots of notes (for each yellow)") + "»?"
        if user_consent(text, title):
            create(editor, web_view, img_field)
            tooltip(f"<p style='color: yellow; background-color: black'>createNotes()</p>")
            dialog.close()



# Connect the button to the editor
gui_hooks.editor_did_init_buttons.append(setup_image_button)

gui_hooks.browser_will_show.append(browser_show)




def create_note_type_if_not_exists():
    col = mw.col
    models = col.models    
    name = "Image Occlusion Simple (v1.1)"
    if models.by_name(name):
        return
    
    # Loading HTML and CSS
    base_path = Path(__file__).parent / "note_type"
    front = (base_path / "Image Occlusion Simple_Front_Side.html").read_text(encoding="utf-8")
    back = (base_path / "Image Occlusion Simple_Back_Side.html").read_text(encoding="utf-8")
    styling = (base_path / "Image Occlusion Simple_CSS.css").read_text(encoding="utf-8")

    model = models.new(name)
    model["type"] = MODEL_STD
    model["sortf"] = 0  # set sortfield to question
    model["css"] = styling

    models.add_field(model, models.new_field("Front"))
    models.add_field(model, models.new_field("Back"))

    # Add template
    template = models.new_template("Card 1")
    template["qfmt"] = front
    template["afmt"] = back
    models.add_template(model, template)
    models.add(model)    

profile_did_open.append(create_note_type_if_not_exists)



