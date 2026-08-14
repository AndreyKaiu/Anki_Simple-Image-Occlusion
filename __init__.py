# -*- coding: utf-8 -*-
# Simple Image Occlusion
# https://github.com/AndreyKaiu/Anki_Simple-Image-Occlusion
# Version 2.1, date: 2026-08-14
from aqt.qt import *
from aqt.editor import Editor
from aqt.browser.browser import Browser
from aqt import gui_hooks
from aqt.utils import showInfo
from aqt.utils import askUser
from pathlib import Path
import re
import os
import shutil
import time
import inspect
from aqt.addcards import AddCards

from aqt import mw
import anki.lang
from aqt.utils import (showText, showInfo, tooltip) 
from bs4 import BeautifulSoup
# from aqt.gui_hooks import collection_did_load
from aqt.gui_hooks import profile_did_open


from anki.consts import MODEL_STD

from . import CSS_Injector



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
editorD = None
close_avtosave = True
words_field_val = None
lngtag_field_val = None
audiofile_field_val = None
Header_field_val = None
HeaderURL_filepdfpage_field_val = None
FrontExtra_field_val = None
Back_field_val = None
BackExtra_field_val = None
Comments_field_val = None
URLVictory_field_val = None
idxcurrentField = 0
single_card_radio = None
browserS = None
ExistsIOS1 = False
ExistsIOS2 = False
CreateTypeIOS = 'v2'
v2_radio = None
next_right = None
next_down = None



# needed to get the file name from "pycmd('play:'
def inject_audio_filenames(text: str, card, kind: str) -> str:
    if 'data-srcsio="' in text:
        return text

    card.render_output()

    q_tags = card.question_av_tags()
    a_tags = card.answer_av_tags()

    def repl(match):
        full_tag = match.group(0)
        cmd = match.group(2)
        
        try:
            _, context, idx = cmd.split(":")
            idx = int(idx)

            tags = q_tags if context == "q" else a_tags

            if 0 <= idx < len(tags):
                filename = tags[idx].filename
            elif tags:
                filename = tags[0].filename
            else:
                filename = ""

        except Exception:
            filename = ""

        return full_tag.replace(
            '<a',
            f'<a data-srcsio="{filename}"',
            1
        )

    return re.sub(
        r'(<a[^>]*class="[^"]*soundLink[^"]*"[^>]*onclick="[^"]*pycmd\(\'(play:[^\']+)\'\)[^"]*"[^>]*>)',
        repl,
        text
    )

gui_hooks.card_will_show.append(inject_audio_filenames)





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
    global single_card_radio, next_right, next_down, editorD 
    global idxcurrentField, close_avtosave
    global dialog, words_field_val, audiofile_field_val, Header_field_val, HeaderURL_filepdfpage_field_val, FrontExtra_field_val, Back_field_val, BackExtra_field_val, Comments_field_val, URLVictory_field_val, lngtag_field_val, ExistsIOS1, ExistsIOS2, CreateTypeIOS, v2_radio
    words_field_val = None # if the 'Words' field is found
    lngtag_field_val = None # if the 'LngTag' field is found
    audiofile_field_val = None
    Header_field_val = None
    HeaderURL_filepdfpage_field_val = None
    FrontExtra_field_val = None
    Back_field_val = None
    BackExtra_field_val = None
    Comments_field_val = None
    URLVictory_field_val = None

    editorD = self
    
    img_field = None
    img_path = None
    content = None
    idx = getattr(self, "currentField", None)
    idxcurrentField = idx

    model_name = self.note.model()["name"]
    if not model_name.startswith("Image Occlusion Simple"):
        showInfo("ERROR. The note type must begin with 'Image Occlusion Simple'")
        return
    
    field_names = list(self.note.keys())
    if "Front" not in field_names:
        showInfo("ERROR. Field 'Front' not found.")
        return
        
        
    # ------------------------------------------------------------
    # CHECKING FIELDS FOR CONVERSION FROM STANDARD IMAGE HIDING
    # ------------------------------------------------------------
    content_cloze = []          #  {{cX::image-occlusion:...}}
    content_img_tag = None      #  <img>
    fields_to_clear = []        

    for fname in field_names:
        val = self.note[fname]
        if not val:
            continue
        
        if '::image-occlusion:' in val:            
            matches = re.findall(r'{{c\d+::image-occlusion:[^}]+}}', val)
            if matches:
                content_cloze.extend(matches)                
                self.note[fname] = ""
                fields_to_clear.append(fname)
                continue    


    if content_cloze:
        
        for fname in field_names:
            val = self.note[fname]
            if not val:
                continue
                    
            stripped = val.strip()
            img_match = re.match(r'^<img[^>]*>$', stripped)
            if img_match:
                content_img_tag = stripped
                self.note[fname] = ""
                fields_to_clear.append(fname)
                continue


        # Now let's transform each cloze line into a div
        divs = []
        for cloze in content_cloze:
            inner = re.search(r'{{c\d+::image-occlusion:([^}]+)}}', cloze)
            if not inner:
                continue
            inner_str = inner.group(1)
            # Let's analyze the parameters
            parts = inner_str.split(':')
            if not parts:
                continue
            typ = parts[0]  # rect, ellipse, polygon, text
            params = {}
            for p in parts[1:]:
                if '=' in p:
                    k, v = p.split('=', 1)
                    params[k] = v

            left = top = width = height = None
            text = ""

            if typ == 'rect':
                left = float(params.get('left', 0))
                top = float(params.get('top', 0))
                width = float(params.get('width', 0))
                height = float(params.get('height', 0))
            elif typ == 'ellipse':
                left = float(params.get('left', 0))
                top = float(params.get('top', 0))
                rx = float(params.get('rx', 0))
                ry = float(params.get('ry', 0))
                width = 2 * rx
                height = 2 * ry    
            elif typ == 'polygon':
                # Extracting points
                points_str = params.get('points', '')
                if points_str:
                    point_pairs = points_str.split()
                    points = []
                    for pair in point_pairs:
                        if ',' in pair:
                            x, y = pair.split(',')
                            points.append((float(x), float(y)))
                    if points:
                        xs = [p[0] for p in points]
                        ys = [p[1] for p in points]
                        left = min(xs)
                        top = min(ys)
                        width = max(xs) - left
                        height = max(ys) - top
            elif typ == 'text':
                left = float(params.get('left', 0))
                top = float(params.get('top', 0))
                scale = float(params.get('scale', 1.0))
                fs = float(params.get('fs', 0.01))
                text = params.get('text', '')            
                width = scale * fs * len(text)            
                height = 1.2 * scale * fs
            else:
                # Unknown type - skip
                continue

            # If any parameter is not defined, skip it.
            if left is None or top is None or width is None or height is None:
                continue

            # Convert fractions to percentages (multiply by 100)
            left_pct = left * 100
            top_pct = top * 100
            width_pct = width * 100
            height_pct = height * 100

            # Forming a style (with 5 decimal places)
            style = f"left: {left_pct:.5f}%; top: {top_pct:.5f}%; width: {width_pct:.5f}%; height: {height_pct:.5f}%;"

            cls = "sio-rect"
            if typ == 'ellipse':
                cls += " round"
            

            div_html = f'<div class="{cls}" style="{style}" word="{text}" hint=""></div>'
            divs.append(div_html)


        # Now let's prepare the image
        img_src = None
        if content_img_tag:
            src_match = re.search(r'src=["\'](.*?)["\']', content_img_tag)
            if src_match:
                img_src = src_match.group(1)
                # Create a new img tag with a class
                content_img_tag = f'<img src="{img_src}" class="sio-image">'
        
        
        # Assembling the final HTML for the Front field
        if content_img_tag:
            final_front = content_img_tag + ''.join(divs)
            self.note['Front'] = final_front
        
    # ------------------------------------------------------------
    
    
    idx = field_names.index("Front")
    # Set the current field index
    self.currentField = idx
    # Force focus on the editor
    self.web.eval(f"focusField({idx});")

    # if idx is None:
    #     locF = localizationF("Unable_to_determine_active_field", "Unable to determine active field.")
    #     showInfo(locF)
    #     return        

    # Get the field name by index    
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
        showInfo(f"{locF.format(field=field)}.")
        return
    
    # Check for the presence of the 'Words' field and save its value
    if 'Words' in field_names:
        words_field_val = self.note['Words']
        if words_field_val is None:
            words_field_val = ""

    # Check for the presence of the 'LngTag' field and save its value
    if 'LngTag' in field_names:
        lngtag_field_val = self.note['LngTag']       
        if lngtag_field_val is None:
            lngtag_field_val = ""
    
    if 'AudioFile' in field_names:
        audiofile_field_val = self.note['AudioFile']
        if audiofile_field_val is None:
            audiofile_field_val = ""

    if 'Header' in field_names:
        Header_field_val = self.note['Header']
        if Header_field_val is None:
            Header_field_val = ""

    if 'HeaderURL_filepdf#page=' in field_names:
        HeaderURL_filepdfpage_field_val = self.note['HeaderURL_filepdf#page=']
        if HeaderURL_filepdfpage_field_val is None:
            HeaderURL_filepdfpage_field_val = ""

    if 'Front Extra' in field_names:
        FrontExtra_field_val = self.note['Front Extra']
        if FrontExtra_field_val is None:
            FrontExtra_field_val = ""
    
    if 'Back' in field_names:
        Back_field_val = self.note['Back']
        if Back_field_val is None:
            Back_field_val = ""
    
    if 'Back Extra' in field_names:
        BackExtra_field_val = self.note['Back Extra']
        if BackExtra_field_val is None:
            BackExtra_field_val = ""
    
    if 'Comments' in field_names:
        Comments_field_val = self.note['Comments']
        if Comments_field_val is None:
            Comments_field_val = ""
    
    if 'URLVictory' in field_names:
        URLVictory_field_val = self.note['URLVictory']
        if URLVictory_field_val is None:
            URLVictory_field_val = ""
    

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
    create_button = QPushButton(localizationF("Create_new", "Create new"))
    create_button.clicked.connect(lambda: createNotes(self, web_view, img_field))
    card_option_layout.addWidget(create_button)
    
    tab_label = QLabel("Tab:")
    card_option_layout.addWidget(tab_label)
    
    next_right = QCheckBox('⇥ ;')
    card_option_layout.addWidget(next_right)
    
    next_down = QCheckBox('⤓')
    card_option_layout.addWidget(next_down)
    
    if 'data-tab-down="true"' in html_field:
        next_right.setChecked(False)
        next_down.setChecked(True)
    elif 'data-tab-down="false"' in html_field: 
        next_down.setChecked(False)
        next_right.setChecked(True)
    else:
        next_down.setChecked(False)
        next_right.setChecked(False)
        
        
        
    def next_right_click():
        if not next_right.isChecked():
            next_right.setChecked(False)
        else:
            next_right.setChecked(True)
            next_down.setChecked(False)
        
    next_right.clicked.connect(lambda: next_right_click())
    
    def next_down_click():
        if not next_down.isChecked():
            next_down.setChecked(False)
        else:
            next_right.setChecked(False)
            next_down.setChecked(True)
        
    next_down.clicked.connect(lambda: next_down_click())

    locF = localizationF("Version", "Version")
    card_option_label2 = QLabel(locF+":")
    card_option_layout.addWidget(card_option_label2)
    
    IOS_model_name1 = "Image Occlusion Simple (v1.1)"
    IOS_model_name2 = "Image Occlusion Simple (v2)"
    note_type = self.note.note_type()    
    cur_IOS1 = note_type['name'] == IOS_model_name1 
    cur_IOS2 = note_type['name'] == IOS_model_name2 

    ExistsIOS1 = False
    ExistsIOS2 = False
    CreateTypeIOS = 'v2'
    models = self.mw.col.models
    for model in models.all():
        if model['name'] == IOS_model_name1:            
            ExistsIOS1 = True  
        if model['name'] == IOS_model_name2:            
            ExistsIOS2 = True              
    
    ver_group = QButtonGroup()
    if not ExistsIOS1 and not cur_IOS1:
        v2_radio = QRadioButton('v2')
        v2_radio.setChecked(True)
        CreateTypeIOS = 'v2'        
        ver_group.addButton(v2_radio)        
        card_option_layout.addWidget(v2_radio)
    else:
        v1_1_radio = QRadioButton('v1.1')
        v2_radio = QRadioButton('v2')
        if cur_IOS1:
            v1_1_radio.setChecked(True)    
            v2_radio.setChecked(False)
            CreateTypeIOS = 'v1.1'
        elif cur_IOS2:
            v1_1_radio.setChecked(False)    
            v2_radio.setChecked(True)
            CreateTypeIOS = 'v2'
        
        ver_group.addButton(v1_1_radio)
        card_option_layout.addWidget(v1_1_radio)
        ver_group.addButton(v2_radio)        
        card_option_layout.addWidget(v2_radio)
   

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

    # Adding a saveclose button
    locF = localizationF("Save_сlose","💾 Save and Close")    
    saveclose_button = QPushButton(locF)
    saveclose_button.clicked.connect(lambda: saveclose(self, web_view, img_field))      
    button_layout.addWidget(saveclose_button)

    # Adding a close button    
    close_button = QPushButton(localizationF("Cancel and close", "Cancel and close"))
    close_button.clicked.connect(lambda: closeDialog())
    button_layout.addWidget(close_button)
    layout.addLayout(button_layout)

    # avtosave by ESC
    original_reject = dialog.reject
    def custom_reject():
        global close_avtosave
        if close_avtosave:
            saveclose(self, web_view, img_field)            
        original_reject()
    dialog.reject = custom_reject
    close_avtosave = True

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
        hard = rect.get('hard', '')
        if hard != '':
            if hard == "0":
                hard = ""
            else:
                hard = f' hard="{hard}"'
        
        
        line = ' line' if 'line' in rect.get('class', []) else ''
        round = ' round' if 'round' in rect.get('class', []) else ''
        notvisible = ' notvisible' if 'notvisible' in rect.get('class', []) else ''
        hiding = ' hiding' if 'hiding' in rect.get('class', []) else ''
        if line != '':
            hiding = ''
            round = ''

        # Forming the contents of txt-rectangle
        txt_content = word
        if hint:
            txt_content += f"::{hint}"

        # Forming div class="sio-rect"
        rectangle_html = f'''
<div class="sio-rect{hiding}{round}{line}{notvisible} cursor-move" style="{filtered_style}"{hard}>
    <div class="txt-sio-rect" contenteditable="false">{txt_content}</div>
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
    global next_down, next_right
    """Parses HTML and returns minified HTML and list of words"""
    soup = BeautifulSoup(html_content, 'html.parser')
    # We extract <img>
    img_tag = soup.find('img')
    img_src = img_tag['src'] if img_tag else ''

    # We extract <div class="sio-rect">
    rectangles = []
    words_list = []  # List to collect all words
    
    for rect in soup.find_all('div', class_='sio-rect'):
        style = rect.get('style', '')
        if '%' not in style:
            continue  # We skip the ENTIRE rect block if its style does not contain any % at all
        
        # Checking the conditions for including a word in words_list        
        rect_classes = rect.get('class', [])
        rect_style = rect.get('style', '')
        
        # Checking whether this rectangle should be included in words_list
        include_in_words = (
            'hiding' not in rect_classes and
            'line' not in rect_classes and
            'display: none' not in rect_style
        )
        
        # Extract left and top values for sorting
        left = 0
        top = 0
        width = 0
        height = 0
        for match in re.finditer(r'(left|top|width|height):([^;]+);', style):
            key = match.group(1)
            raw = match.group(2)
            if key == 'left':
                if '%' in raw:
                    left = float(raw.strip('%'))  # Convert percentage to float
                else:
                    left = 0
            elif key == 'top':
                if '%' in raw:
                    top = float(raw.strip('%'))  # Convert percentage to float
                else:
                    top = 0
            elif key == 'width':
                if '%' in raw:
                    width = float(raw.strip('%'))  # Convert percentage to float
                else:
                    width = 0
            elif key == 'height':
                if '%' in raw:
                    height = float(raw.strip('%'))  # Convert percentage to float
                else:
                    height = 0
                    

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
                
        word = word.replace("\"", "'")
        hint = hint.replace("\"", "'")        
        
        # Add a word to the list if it meets the filtering criteria
        if include_in_words and word and word.strip():
            words_list.append(word.strip())
        
        line = ' line' if 'line' in rect.get('class', []) else ''
        round = ' round' if 'round' in rect.get('class', []) else ''
        notvisible = ' notvisible' if 'notvisible' in rect.get('class', []) else ''
        hiding = ' hiding' if 'hiding' in rect.get('class', []) else ''
        hard = rect.get('hard', '')
        if hard != '':
            if hard == "0":
                hard = ""
            else:
                hard = f' hard="{hard}"'
        
        contenteditable = 'contenteditable="false"' if hiding else 'contenteditable="true"'
        if line != '':
            hiding = ''
            round = ''

        # Do not take into account lines and hidden objects in sorting
        if line!='' or hiding != '':
            left = 100
            top = 100  
        
            
        # Append rectangle data with position for sorting
        rectangles.append({
            'html': f'<div class="sio-rect{hiding}{round}{line}{notvisible}" style="{filtered_style}" word="{word}" hint="{hint}"{hard}></div>',
            'left': left,
            'top': top,
            'width': width,
            'height': height
        })



    def normalize_left(rectangles):
        leftM = -1

        while True:
            RM = None
            min_left = float('inf')
            
            for r in rectangles:
                if r['left'] > leftM and r['left'] < min_left:
                    min_left = r['left']
                    RM = r

            if RM is None:
                break

            leftM = RM['left']
            widthM = RM['width']
            
            for r in rectangles:
                if r is RM:
                    continue

                if r['left'] != leftM:
                    cond = (
                        (leftM > r['left'] and leftM <= r['left'] + (r['width'] / 2) ) or
                        (r['left'] > leftM and r['left'] <= leftM + (widthM / 2) )
                    )

                    if cond:
                        r['left'] = leftM


    def normalize_top(rectangles):
        topM = -1

        while True:
            RM = None
            min_top = float('inf')

            for r in rectangles:
                if r['top'] > topM and r['top'] < min_top:
                    min_top = r['top']
                    RM = r

            if RM is None:
                break

            topM = RM['top']
            heightM = RM['height']

            for r in rectangles:
                if r is RM:
                    continue

                if r['top'] != topM:
                    cond = (
                        (topM > r['top'] and topM <= r['top'] + r['height'] / 2) or
                        (r['top'] > topM and r['top'] <= topM + heightM / 2)
                    )

                    if cond:
                        r['top'] = topM

    

    if next_down.isChecked():        
        normalize_top(rectangles)        
        normalize_left(rectangles)       
        # Sort rectangles by left, then by top        
        rectangles.sort(key=lambda r: (r['left'], r['top']))
    elif next_right.isChecked():
        normalize_left(rectangles)
        normalize_top(rectangles)
        # Sort rectangles by top, then by left
        rectangles.sort(key=lambda r: (r['top'], r['left']))

    
    # AnkiDroid may be replacing line breaks with <br>, causing problems.
    # rects_html = '\n'.join(rect['html'] for rect in rectangles)
    # final_html = f'<img src="{img_src}" class="sio-image">\n{rects_html}'

    # Assemble the final HTML
    rects_html = ''.join(rect['html'] for rect in rectangles)    
    if next_down.isChecked():
        final_html = f'<img src="{img_src}" class="sio-image" data-tab-down="true">{rects_html}'
    elif next_right.isChecked():
        final_html = f'<img src="{img_src}" class="sio-image" data-tab-down="false">{rects_html}'
    else:        
        final_html = f'<img src="{img_src}" class="sio-image">{rects_html}'
    
    words_list.sort()

    return final_html, words_list


def get_modified_html(web_view, callback):
    """Gets the modified HTML from QWebEngineView and processes it"""
    def internal_callback(html):
        processed_html, words_list = process_html(html)
        # We pass both values ​​to the callback
        callback(processed_html, words_list)
    web_view.page().toHtml(internal_callback)


def save(editor, web_view, img_field):    
    def on_html_processed(html_content, words_list):
        global words_field_val, lngtag_field_val, audiofile_field_val, Header_field_val, HeaderURL_filepdfpage_field_val, FrontExtra_field_val, Back_field_val, BackExtra_field_val, Comments_field_val, URLVictory_field_val
        if not html_content:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Save...</p>")
            return
        if not isinstance(html_content, str):
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Type html_content...</p>")
            return
        if not editor.note:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Note not initialized...</p>")
            return

        # Saving HTML in the image field
        editor.note[img_field] = html_content
        
        # If words_field_val is passed and it is not None, update the Words field
        if words_field_val is not None:
            # If there is a list of words, combine them
            if words_list and len(words_list) > 0:
                # We combine words using a space or another separator
                combined_words = '; '.join(words_list)
                editor.note['Words'] = combined_words
            else:
                # If there are no words, save the empty line
                editor.note['Words'] = ''
        
        # If lngtag_field_val is passed and it is not None, update the LngTag field
        if lngtag_field_val is not None:
            editor.note['LngTag'] = lngtag_field_val
        
        if audiofile_field_val is not None:
            editor.note['AudioFile'] = audiofile_field_val
        
        if Header_field_val is not None:
            editor.note['Header'] = Header_field_val
        
        if HeaderURL_filepdfpage_field_val is not None:
            editor.note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

        if FrontExtra_field_val is not None:
            editor.note['Front Extra'] = FrontExtra_field_val

        if Back_field_val is not None:
            editor.note['Back'] = Back_field_val
        
        if BackExtra_field_val is not None:
            editor.note['Back Extra'] = BackExtra_field_val
        
        if Comments_field_val is not None:
            editor.note['Comments'] = Comments_field_val
        
        if URLVictory_field_val is not None:
            editor.note['URLVictory'] = URLVictory_field_val
        
        # Mark the note as modified
        # editor.note.modified = True
        
        
        if editor.note.id != 0:
            editor.note.flush()
            # editor.mw.col.update_note(editor.note)
            editor.mw.fade_in_webview()
            editor._refresh_needed = None
        
        editor.loadNoteKeepingFocus()
                                

        locF = localizationF("Saved", "Saved")
        tooltip(f"<p style='color: yellow; background-color: black'>{locF}</p>")

    # Pass both values ​​to get_modified_html
    get_modified_html(web_view, on_html_processed)



def saveclose(editor, web_view, img_field):
    global dialog, close_avtosave, idxcurrentField, editorD  
    save(editor, web_view, img_field)
    close_avtosave = True
    if idxcurrentField is not None and editorD is not None:
        editorD.currentField = idxcurrentField
        editorD.web.eval(f"focusField({idxcurrentField});")
    dialog.close()


def closeDialog():
    global dialog, close_avtosave, idxcurrentField, editorD 
    close_avtosave = False
    if idxcurrentField is not None and editorD is not None:
        editorD.currentField = idxcurrentField
        editorD.web.eval(f"focusField({idxcurrentField});")
    dialog.close()


def RefreshDeck_id(editor, deck_id):  
    """update the type of column maps"""     
    deck_name = browserS.mw.col.decks.name(deck_id)
    if Browser and deck_name:        
        browserS.sidebar.update_search(f'"deck:{deck_name}"')



def create(editor, web_view, img_field):
    editornoteid = editor.note.id

    def on_html_processed(html_content, words_list):
        global words_field_val, lngtag_field_val, audiofile_field_val, Header_field_val, HeaderURL_filepdfpage_field_val, FrontExtra_field_val, Back_field_val, BackExtra_field_val, Comments_field_val, URLVictory_field_val
        global ExistsIOS1, ExistsIOS2, CreateTypeIOS, v2_radio

        if not html_content:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Save...</p>")
            return
        if not isinstance(html_content, str):
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Type html_content...</p>")
            return
        if not editor.note:
            tooltip(f"<p style='color: yellow; background-color: black'>ERROR. Note not initialized...</p>")
            return
        
        IOS_model_name1 = "Image Occlusion Simple (v1.1)"
        IOS_model_name2 = "Image Occlusion Simple (v2)"
        note_type = editor.note.note_type()
        deck_id = editor.note.cards()[0].did if editor.note.cards() else editor.mw.col.decks.selected()        
        findIOS1 = False 
        findIOS2 = False 
        findIOS = False 

        if not v2_radio is None:
            if v2_radio.isChecked():
                CreateTypeIOS = 'v2'
            else:
                CreateTypeIOS = 'v1.1'

        # We are looking for the Image Occlusion Simple model.        
        models = editor.mw.col.models

        if CreateTypeIOS == 'v2' and ExistsIOS2:
            for model in models.all():
                if model['name'] == IOS_model_name2:
                    note_type = model
                    findIOS2 = True  
                    break
        elif CreateTypeIOS != 'v2' and ExistsIOS1: 
            for model in models.all():
                if model['name'] == IOS_model_name1:
                    note_type = model
                    findIOS1 = True
                    break
             
        findIOS = findIOS1 or findIOS2

        cur_IOS1 = note_type['name'] == IOS_model_name1 
        cur_IOS2 = note_type['name'] == IOS_model_name2 
        
        savedNote = False
        crN = 0
        
        # Create one new with full html_content
        if single_card_radio.isChecked():  
            if editornoteid != 0 or not (cur_IOS1 or cur_IOS2): # not added or the current note is not Image Occlusion Simple
                # !!!! Remove this code, since there should always already be a note type starting with 'Image Occlusion Simple'
                new_note = editor.mw.col.new_note(note_type)
                if not findIOS:
                    # Copy values from original note to maintain consistency
                    for field_name in editor.note.keys():
                        if field_name == img_field:
                            new_note[field_name] = html_content
                        else:
                            new_note[field_name] = editor.note[field_name]
                else:
                    for field_name in editor.note.keys():
                        if field_name == img_field:
                            new_note["Front"] = html_content

                    if findIOS2:
                        # Update the Words field
                        if words_list and len(words_list) > 0:
                            combined_words = '; '.join(words_list)
                            if 'Words' in new_note.keys():
                                new_note['Words'] = combined_words                  
                        
                        # Update the LngTag field if lngtag_field_val is not None
                        if lngtag_field_val is not None and 'LngTag' in new_note.keys():
                            new_note['LngTag'] = lngtag_field_val

                        if audiofile_field_val is not None and 'AudioFile' in new_note.keys():
                            new_note['AudioFile'] = audiofile_field_val

                        if Header_field_val is not None and 'Header' in new_note.keys():
                            new_note['Header'] = Header_field_val

                        if HeaderURL_filepdfpage_field_val is not None and 'HeaderURL_filepdf#page=' in new_note.keys():
                            new_note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

                        if FrontExtra_field_val is not None and 'Front Extra' in new_note.keys():
                            new_note['Front Extra'] = FrontExtra_field_val

                        if Back_field_val is not None and 'Back' in new_note.keys():
                            new_note['Back'] = Back_field_val
                        
                        if BackExtra_field_val is not None and 'Back Extra' in new_note.keys():
                            new_note['Back Extra'] = BackExtra_field_val
                        
                        if Comments_field_val is not None and 'Comments' in new_note.keys():
                            new_note['Comments'] = Comments_field_val
                        
                        if URLVictory_field_val is not None and 'URLVictory' in new_note.keys():
                            new_note['URLVictory'] = URLVictory_field_val
                        

                # Add the note to the collection            
                editor.mw.col.add_note(new_note, deck_id)                               
            else:
                editor.note[img_field] = html_content

                if cur_IOS2:
                    # Update the Words field in the current note
                    if words_list and len(words_list) > 0:
                        combined_words = '; '.join(words_list)
                        if 'Words' in editor.note.keys():
                            editor.note['Words'] = combined_words
                    
                    # Update the LngTag field in the current note
                    if lngtag_field_val is not None and 'LngTag' in editor.note.keys():
                        editor.note['LngTag'] = lngtag_field_val

                    if audiofile_field_val is not None and 'AudioFile' in editor.note.keys():
                        editor.note['AudioFile'] = audiofile_field_val

                    if Header_field_val is not None and 'Header' in editor.note.keys():
                        editor.note['Header'] = Header_field_val
                    
                    if HeaderURL_filepdfpage_field_val is not None and 'HeaderURL_filepdf#page=' in editor.note.keys():
                        editor.note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

                    if FrontExtra_field_val is not None and 'Front Extra' in editor.note.keys():
                        editor.note['Front Extra'] = FrontExtra_field_val
                    
                    if Back_field_val is not None and 'Back' in editor.note.keys():
                        editor.note['Back'] = Back_field_val
                    
                    if BackExtra_field_val is not None and 'Back Extra' in editor.note.keys():
                        editor.note['Back Extra'] = BackExtra_field_val
                    
                    if Comments_field_val is not None and 'Comments' in editor.note.keys():
                        editor.note['Comments'] = Comments_field_val
                    
                    if URLVictory_field_val is not None and 'URLVictory' in editor.note.keys():
                        editor.note['URLVictory'] = URLVictory_field_val
                    
                    
                
                savedNote = True                
            crN += 1
        

        else:  # Otherwise, it is necessary to create for each class Sio-Rect (but not for Line or Hiding)            
            soup = BeautifulSoup(html_content, 'html.parser')
            sio_rects = soup.find_all('div', class_='sio-rect')
            # We filter the elements, excluding those that have a class "line" or "hiding"
            valid_rects = [rect for rect in sio_rects if 'line' not in rect.get('class', []) and 'hiding' not in rect.get('class', [])]
            
            # Create a new entry for each Valid_rect
            for idx, current_rect in enumerate(valid_rects):                
                new_soup = BeautifulSoup(str(soup), 'html.parser') # Copy HTML for a new entry
                
                # Get the word for the current rectangle
                current_word = current_rect.get('word', '')
                
                # Processing all rects in a new copy
                for rect in new_soup.find_all('div', class_='sio-rect'):
                    if rect != current_rect:
                        # Add the "hiding" class to all elements except the current one
                        existing_classes = rect.get('class', [])
                        if 'hiding' not in existing_classes:
                            rect['class'] = existing_classes + ['hiding']
                
                new_html_content = str(new_soup) # We convert HTML back into the line
                new_note = editor.mw.col.new_note(note_type) # Create a new record
                
                if not findIOS:
                    for field_name in editor.note.keys():
                        if field_name == img_field:
                            new_note[field_name] = new_html_content
                        else:
                            new_note[field_name] = editor.note[field_name]
                    
                    # Add the note to the collection
                    editor.mw.col.add_note(new_note, deck_id)
                    crN += 1
                else:                    
                    if editornoteid != 0 or not (cur_IOS1 or cur_IOS2): # not added or the current note is not Image Occlusion Simple   
                        # !!!! Remove this code, since there should always already be a note type starting with 'Image Occlusion Simple'                 
                        new_note["Front"] = new_html_content
                        
                        if findIOS2:
                            # Save the current word in the Words field
                            if current_word and 'Words' in new_note.keys():
                                new_note['Words'] = current_word                            
                            
                            # Save LngTag (we always use the global lngtag_field_val)
                            if lngtag_field_val is not None and 'LngTag' in new_note.keys():
                                new_note['LngTag'] = lngtag_field_val

                            if audiofile_field_val is not None and 'AudioFile' in new_note.keys():
                                new_note['AudioFile'] = audiofile_field_val

                            if Header_field_val is not None and 'Header' in new_note.keys():
                                new_note['Header'] = Header_field_val

                            if HeaderURL_filepdfpage_field_val is not None and 'HeaderURL_filepdf#page=' in new_note.keys():
                                new_note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

                            if FrontExtra_field_val is not None and 'Front Extra' in new_note.keys():
                                new_note['Front Extra'] = FrontExtra_field_val
                            
                            if Back_field_val is not None and 'Back' in new_note.keys():
                                new_note['Back'] = Back_field_val
                            
                            if BackExtra_field_val is not None and 'Back Extra' in new_note.keys():
                                new_note['Back Extra'] = BackExtra_field_val
                            
                            if Comments_field_val is not None and 'Comments' in new_note.keys():
                                new_note['Comments'] = Comments_field_val
                            
                            if URLVictory_field_val is not None and 'URLVictory' in new_note.keys():
                                new_note['URLVictory'] = URLVictory_field_val
                            
                            
                        
                        # Add the note to the collection
                        editor.mw.col.add_note(new_note, deck_id)
                    else:
                        if crN == 0:
                            editor.note["Front"] = new_html_content
                            editor.note[img_field] = new_html_content

                            if cur_IOS2:                                
                                # Save the current word in the Words field of the current note
                                if current_word and 'Words' in editor.note.keys():
                                    editor.note['Words'] = current_word                                
                                
                                # Save LngTag (we always use the global lngtag_field_val)
                                if lngtag_field_val is not None and 'LngTag' in editor.note.keys():
                                    editor.note['LngTag'] = lngtag_field_val

                                if audiofile_field_val is not None and 'AudioFile' in editor.note.keys():
                                    editor.note['AudioFile'] = audiofile_field_val

                                if Header_field_val is not None and 'Header' in editor.note.keys():
                                    editor.note['Header'] = Header_field_val

                                if HeaderURL_filepdfpage_field_val is not None and 'HeaderURL_filepdf#page=' in editor.note.keys():
                                    editor.note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

                                if FrontExtra_field_val is not None and 'Front Extra' in editor.note.keys():
                                    editor.note['Front Extra'] = FrontExtra_field_val
                                
                                if Back_field_val is not None and 'Back' in editor.note.keys():
                                    editor.note['Back'] = Back_field_val
                                
                                if BackExtra_field_val is not None and 'Back Extra' in editor.note.keys():
                                    editor.note['Back Extra'] = BackExtra_field_val
                                
                                if Comments_field_val is not None and 'Comments' in editor.note.keys():
                                    editor.note['Comments'] = Comments_field_val
                                
                                if URLVictory_field_val is not None and 'URLVictory' in editor.note.keys():
                                    editor.note['URLVictory'] = URLVictory_field_val
                                
                         
                                
                                
                            savedNote = True
                        else:                         
                            new_note["Front"] = new_html_content

                            if cur_IOS2:                                
                                # Save the current word in the Words field
                                if current_word and 'Words' in new_note.keys():
                                    new_note['Words'] = current_word                                
                                
                                # Save LngTag (we always use the global lngtag_field_val)
                                if lngtag_field_val is not None and 'LngTag' in new_note.keys():
                                    new_note['LngTag'] = lngtag_field_val

                                if audiofile_field_val is not None and 'AudioFile' in new_note.keys():
                                    new_note['AudioFile'] = audiofile_field_val

                                if Header_field_val is not None and 'Header' in new_note.keys():
                                    new_note['Header'] = Header_field_val
                                
                                if HeaderURL_filepdfpage_field_val is not None and 'HeaderURL_filepdf#page=' in new_note.keys():
                                    new_note['HeaderURL_filepdf#page='] = HeaderURL_filepdfpage_field_val

                                if FrontExtra_field_val is not None and 'Front Extra' in new_note.keys():
                                    new_note['Front Extra'] = FrontExtra_field_val
                                
                                if Back_field_val is not None and 'Back' in new_note.keys():
                                    new_note['Back'] = Back_field_val
                                
                                if BackExtra_field_val is not None and 'Back Extra' in new_note.keys():
                                    new_note['Back Extra'] = BackExtra_field_val
                                
                                if Comments_field_val is not None and 'Comments' in new_note.keys():
                                    new_note['Comments'] = Comments_field_val
                                
                                if URLVictory_field_val is not None and 'URLVictory' in new_note.keys():
                                    new_note['URLVictory'] = URLVictory_field_val
                            
                            # Add the note to the collection
                            editor.mw.col.add_note(new_note, deck_id)
                    crN += 1  

        if savedNote: # we don't count the one being added, it hasn't been created yet
            crN -= 1

        # Update and save if there are changes        
        if savedNote:
            # editor.note.modified = True
            if editor.note.id != 0:
                editor.note.flush()
                # editor.mw.col.update_note(editor.note)                
                editor.mw.fade_in_webview()
                editor._refresh_needed = None
                
            editor.loadNoteKeepingFocus()            

        locF = localizationF("Created_notes","Created notes:")        
        tooltip(f"<p style='color: yellow; background-color: black'>{locF} {crN}</p>")           
        if editornoteid != 0:
            QTimer.singleShot(500, lambda: RefreshDeck_id(editor, deck_id))

    # We pass the handler to get_modified_html
    get_modified_html(web_view, on_html_processed)


def createNotes(editor, web_view, img_field):
    global single_card_radio, close_avtosave 
    global dialog, idxcurrentField, editorD    
    if single_card_radio:
        title = localizationF("Question", "Question")
        text = localizationF("want_to_create", "Are you sure you want to create")
        if single_card_radio.isChecked():            
            text += " «" + localizationF("Card_for_all_rectangles", "One note for everything") + "»?" 
        else:
            text += " «" + localizationF("Card_per_rectangle", "Lots of notes (for each yellow)") + "»?"
        if user_consent(text, title):
            close_avtosave = False            
            create(editor, web_view, img_field)
            tooltip(f"<p style='color: yellow; background-color: black'>createNotes()</p>")            
            if idxcurrentField is not None and editorD is not None:
                editorD.currentField = idxcurrentField
                editorD.web.eval(f"focusField({idxcurrentField});")
            dialog.close()



# Connect the button to the editor
gui_hooks.editor_did_init_buttons.append(setup_image_button)

gui_hooks.browser_will_show.append(browser_show)




def create_note_type_if_not_exists():
    col = mw.col
    models = col.models    
    name = "Image Occlusion Simple (v2)"

    Attention_Addon_Key = 'attention_Addon_675107747_20260812_23'
    try:        
        attention_Addon = mw.pm.profile.get(Attention_Addon_Key, '')
    except:
        attention_Addon = ''
    if attention_Addon == '':
        try:

            if askUser(text="""PLEASE READ the "Simple Image Occlusion" add-on page!
https://ankiweb.net/shared/info/675107747
Small changes have been made to the "Image Occlusion Simple (v2)" note type:
The font size calculation algorithm has been slightly modified; the active rectangle will be taller than all other rectangles for easier work. The editing mode is now remembered, so you don't have to switch it on every card. A different display has been added for rectangles with reduced or increased difficulty ("hard -1 or +1").
Changes in the special editor:
You can now set two different algorithms for tab positions, or disable them to set a custom order. You can change the rectangle difficulty ("hard -1 or +1") using hotkeys.
In the "Front" field, the image will be displayed with a simplified rectangle layout.
Do not show this window again?""",                     
                        msgfunc=QMessageBox.information,
                        defaultno=False,
                        title="Add-on 'Image Occlusion Simple' version 2. Attention!"):
                mw.pm.profile[Attention_Addon_Key] = 'True'
        except:
            pass


    update_Addon_Key = 'update_Addon_675107747_20260812_23'
    existing = models.by_name(name)
    if existing:
        # We will prompt the user to update the template if he has not updated it yet.
        try:
            # Loading
            update_Addon = mw.pm.profile.get(update_Addon_Key, '')
        except:
            update_Addon = ''
        
        if update_Addon != '':
            return
        
        # Checking the askUser signature
        sig = inspect.signature(askUser)
        kwargs = {"text": (
            f"The note type '{name}' already exists.\n"
            "Do you want to update its templates and styling from the new version?\n"
            "(Don't update if you've made any design changes; save your changes and reload Anki first.)"
        )}
        if "msgTitle" in sig.parameters:
            kwargs["msgTitle"] = "Image Occlusion Simple. Update note type?"
        if "default" in sig.parameters:
            kwargs["default"] = True
            

        should_update = askUser(**kwargs)
        
        if should_update:
            # Loading HTML and CSS
            base_path = Path(__file__).parent / "note_type"
            front = (base_path / "Image Occlusion Simple_Front_Side.html").read_text(encoding="utf-8")
            back = (base_path / "Image Occlusion Simple_Back_Side.html").read_text(encoding="utf-8")
            styling = (base_path / "Image Occlusion Simple_CSS.css").read_text(encoding="utf-8")
            
            existing["css"] = styling

            for tmpl in existing["tmpls"]:
                if tmpl["name"] == "Card 1":
                    tmpl["qfmt"] = front
                    tmpl["afmt"] = back

            models.save(existing)
            col.models.flush()
            
            mw.pm.profile[update_Addon_Key] = 'True'
        return
    
    mw.pm.profile[update_Addon_Key] = 'True'
    
    # Loading HTML and CSS
    base_path = Path(__file__).parent / "note_type"
    front = (base_path / "Image Occlusion Simple_Front_Side.html").read_text(encoding="utf-8")
    back = (base_path / "Image Occlusion Simple_Back_Side.html").read_text(encoding="utf-8")
    styling = (base_path / "Image Occlusion Simple_CSS.css").read_text(encoding="utf-8")

    model = models.new(name)
    model["type"] = MODEL_STD
    model["sortf"] = 1  # set sortfield to question
    model["css"] = styling

    fld = models.new_field("Front")
    fld["description"] = "Paste an image from the clipboard. Edit it with the addon."
    models.add_field(model, fld)    
    fld = models.new_field("Header")
    fld["description"] = "Enter the book title and topic. (auto: page# from the URL)"  
    models.add_field(model, fld)
    fld = models.new_field("HeaderURL_filepdf#page=")
    fld["description"] = "Link to PDF file. Add #page=11 to go to page 11."
    models.add_field(model, fld)
    fld = models.new_field("Words")
    fld["description"] = "Do not fill in! The words that are suggested for input"
    models.add_field(model, fld)
    fld = models.new_field("LngTag")
    fld["description"] = "For non-English (-before disables pronunciation). Tag BCP 47, example: ru_RU, en_US"
    models.add_field(model, fld)
    fld = models.new_field("AudioFile")
    fld["description"] = "Possible sound file for the front side of the card"
    models.add_field(model, fld)
    fld = models.new_field("Front Extra")
    fld["description"] = "Information for the front side of the card"
    models.add_field(model, fld)
    fld = models.new_field("Back")
    fld["description"] = "Information for the back of the card"
    models.add_field(model, fld)
    fld = models.new_field("Back Extra")
    fld["description"] = "Additional information for the back of the card"
    models.add_field(model, fld)
    fld = models.new_field("Comments")
    fld["description"] = "Comments are written during the study process."
    models.add_field(model, fld)
    fld = models.new_field("URLVictory")
    fld["description"] = "Possible link for the winner of the game (method of reward)"
    models.add_field(model, fld)    

    # Add template
    template = models.new_template("Card 1")
    template["qfmt"] = front
    template["afmt"] = back
    models.add_template(model, template)
    models.add(model)    

profile_did_open.append(create_note_type_if_not_exists)



