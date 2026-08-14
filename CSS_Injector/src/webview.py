from typing import Any
from aqt import mw
from aqt.webview import WebContent
from aqt.editor import Editor
from aqt.gui_hooks import webview_will_set_content

# Получаем корневой ID аддона (675107747)
addon_package = mw.addonManager.addonFromModule(__name__)
print("addon_package =", addon_package)

# Разрешаем доступ к статике внутри подпапки CSS_Injector
mw.addonManager.setWebExports(
    addon_package,
    r"CSS_Injector/user_files/.*\.(css|js|png|jpg|svg)|CSS_Injector/web/.*\.(js)"
)

def load_packages(webcontent: WebContent, context: Any) -> None:
    if isinstance(context, Editor):
        base_path = f"/_addons/{addon_package}"
        # Загружаем injector.js из подпапки
        webcontent.js.append(f"{base_path}/CSS_Injector/web/injector.js")
        # Не загружаем editor.css, так как injector.js сам подгрузит field.css
        # (можно оставить, если нужен дополнительный CSS, но не обязательно)

def init_webview() -> None:
    webview_will_set_content.append(load_packages)