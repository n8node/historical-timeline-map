"""
Fetch Wikipedia images for all persons in the project seed SQL files.
Downloads images to backend/uploads/seed/ and generates 05-photo-updates.sql.

Usage:
    pip install requests
    python scripts/fetch_wiki_photos.py
"""

import re
import os
import sys
import time
import hashlib
from typing import Optional
import requests
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = PROJECT_ROOT / "backend" / "uploads" / "seed"
SQL_DIR = PROJECT_ROOT / "init-db"
OUTPUT_SQL = SQL_DIR / "05-photo-updates.sql"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "HistoricalTimelineMap/1.0 (educational project; contact: n8node@users.noreply.github.com)"
}

WIKI_EN = "https://en.wikipedia.org/w/api.php"
WIKI_RU = "https://ru.wikipedia.org/w/api.php"


def extract_persons_from_sql():
    """Parse all SQL INSERT files and extract (name, name_original) pairs."""
    persons = []
    sql_files = sorted(SQL_DIR.glob("*.sql"))

    pattern = re.compile(
        r"\(\s*'([^']+(?:''[^']*)*)',"       # name (handling escaped quotes)
        r"\s*(?:'([^']+(?:''[^']*)*)'|NULL)," # name_original (or NULL)
        r"\s*(-?\d+),"                         # birth_year
        r"\s*(-?\d+),"                         # death_year
    )

    for sql_file in sql_files:
        if sql_file.name == "05-photo-updates.sql":
            continue
        content = sql_file.read_text(encoding="utf-8")
        for match in pattern.finditer(content):
            name_ru = match.group(1).replace("''", "'")
            name_orig = match.group(2).replace("''", "'") if match.group(2) else ""
            persons.append((name_ru, name_orig))

    return persons


def search_wikipedia_image(title: str, wiki_api: str) -> Optional[str]:
    """Query Wikipedia API for the main page image."""
    try:
        resp = requests.get(wiki_api, params={
            "action": "query",
            "titles": title,
            "prop": "pageimages",
            "format": "json",
            "pithumbsize": 500,
            "redirects": 1,
        }, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page in pages.items():
            if page_id == "-1":
                continue
            thumb = page.get("thumbnail", {}).get("source")
            if thumb:
                return thumb
    except Exception as e:
        print(f"    API error for '{title}': {e}")
    return None


def get_full_image_url(thumb_url: str) -> str:
    """Convert thumbnail URL to a larger version (800px)."""
    return re.sub(r"/\d+px-", "/800px-", thumb_url)


def download_image(url: str, filepath: Path) -> bool:
    """Download image from URL to filepath."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "image" not in content_type and "octet-stream" not in content_type:
            print(f"    Not an image: {content_type}")
            return False

        with open(filepath, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)

        size = filepath.stat().st_size
        if size < 1000:
            filepath.unlink()
            print(f"    Too small ({size} bytes), skipped")
            return False

        return True
    except Exception as e:
        print(f"    Download error: {e}")
        if filepath.exists():
            filepath.unlink()
        return False


def make_filename(name_ru: str) -> str:
    """Generate a safe filename from the Russian name."""
    safe = re.sub(r"[^\w\s-]", "", name_ru.lower())
    safe = re.sub(r"\s+", "_", safe.strip())
    short_hash = hashlib.md5(name_ru.encode()).hexdigest()[:6]
    return f"{safe}_{short_hash}.jpg"


def find_image_for_person(name_ru: str, name_orig: str) -> Optional[str]:
    """Try multiple Wikipedia search strategies to find an image."""

    strategies = []

    if name_orig and not all(ord(c) > 127 or c in " -'" for c in name_orig):
        strategies.append((WIKI_EN, name_orig))

    strategies.append((WIKI_RU, name_ru))

    en_name_from_ru = {
        "Хеопс": "Khufu",
        "Рамзес II": "Ramesses II",
        "Нефертити": "Nefertiti",
        "Имхотеп": "Imhotep",
        "Хатшепсут": "Hatshepsut",
        "Эхнатон": "Akhenaten",
        "Чингисхан": "Genghis Khan",
        "Жанна д'Арк": "Joan of Arc",
        "Клеопатра VII": "Cleopatra",
        "Тутанхамон": "Tutankhamun",
        "Александр Македонский": "Alexander the Great",
        "Гай Юлий Цезарь": "Julius Caesar",
        "Леонардо да Винчи": "Leonardo da Vinci",
        "Николай Коперник": "Nicolaus Copernicus",
        "Карл Великий": "Charlemagne",
        "Вильгельм Завоеватель": "William the Conqueror",
        "Марко Поло": "Marco Polo",
        "Фридрих Барбаросса": "Frederick Barbarossa",
        "Ричард Львиное Сердце": "Richard the Lionheart",
        "Мартин Лютер": "Martin Luther",
        "Галилео Галилей": "Galileo Galilei",
        "Исаак Ньютон": "Isaac Newton",
        "Пётр I": "Peter the Great",
        "Наполеон Бонапарт": "Napoleon",
        "Авраам Линкольн": "Abraham Lincoln",
        "Альберт Эйнштейн": "Albert Einstein",
        "Уинстон Черчилль": "Winston Churchill",
        "Махатма Ганди": "Mahatma Gandhi",
        "Мартин Лютер Кинг": "Martin Luther King Jr.",
        "Нельсон Мандела": "Nelson Mandela",
        "Мария Кюри": "Marie Curie",
        "Никола Тесла": "Nikola Tesla",
        "Томас Эдисон": "Thomas Edison",
        "Вольфганг Амадей Моцарт": "Wolfgang Amadeus Mozart",
        "Людвиг ван Бетховен": "Ludwig van Beethoven",
        "Уильям Шекспир": "William Shakespeare",
        "Чарльз Дарвин": "Charles Darwin",
        "Зигмунд Фрейд": "Sigmund Freud",
        "Александр Сергеевич Пушкин": "Alexander Pushkin",
        "Юрий Алексеевич Гагарин": "Yuri Gagarin",
        "Владимир Святой": "Vladimir the Great",
        "Ярослав Мудрый": "Yaroslav the Wise",
        "Александр Невский": "Alexander Nevsky",
        "Дмитрий Донской": "Dmitry Donskoy",
        "Андрей Рублёв": "Andrei Rublev",
        "Иван III Великий": "Ivan III of Russia",
        "Иван IV Грозный": "Ivan the Terrible",
        "Пётр I Великий": "Peter the Great",
        "Екатерина II Великая": "Catherine the Great",
        "Михаил Васильевич Ломоносов": "Mikhail Lomonosov",
        "Лев Николаевич Толстой": "Leo Tolstoy",
        "Фёдор Михайлович Достоевский": "Fyodor Dostoevsky",
        "Антон Павлович Чехов": "Anton Chekhov",
        "Александр Суворов": "Alexander Suvorov",
        "Михаил Иванович Кутузов": "Mikhail Kutuzov",
        "Дмитрий Иванович Менделеев": "Dmitri Mendeleev",
        "Пётр Ильич Чайковский": "Pyotr Ilyich Tchaikovsky",
        "Иосиф Виссарионович Сталин": "Joseph Stalin",
        "Владимир Ильич Ленин": "Vladimir Lenin",
        "Георгий Константинович Жуков": "Georgy Zhukov",
        "Сергей Павлович Королёв": "Sergei Korolev",
        "Игорь Васильевич Курчатов": "Igor Kurchatov",
        "Андрей Дмитриевич Сахаров": "Andrei Sakharov",
        "Дмитрий Дмитриевич Шостакович": "Dmitri Shostakovich",
        "Сергей Михайлович Эйзенштейн": "Sergei Eisenstein",
        "Михаил Афанасьевич Булгаков": "Mikhail Bulgakov",
        "Валентина Терешкова": "Valentina Tereshkova",
        "Борис Леонидович Пастернак": "Boris Pasternak",
        "Анна Андреевна Ахматова": "Anna Akhmatova",
        "Владимир Владимирович Маяковский": "Vladimir Mayakovsky",
        "Михаил Сергеевич Горбачёв": "Mikhail Gorbachev",
        "Жанна де Бар": "Jeanne de Bar",
    }

    en_name = en_name_from_ru.get(name_ru)
    if en_name:
        strategies.insert(0, (WIKI_EN, en_name))

    for wiki_api, search_name in strategies:
        lang = "en" if "en." in wiki_api else "ru"
        thumb = search_wikipedia_image(search_name, wiki_api)
        if thumb:
            print(f"    Found via {lang} wiki: '{search_name}'")
            return get_full_image_url(thumb)

    return None


def main():
    print("=" * 60)
    print("Fetching Wikipedia photos for Historical Timeline Map")
    print("=" * 60)

    persons = extract_persons_from_sql()
    print(f"\nFound {len(persons)} persons in SQL files\n")

    updates = []
    success = 0
    failed = 0
    skipped = 0

    for i, (name_ru, name_orig) in enumerate(persons):
        filename = make_filename(name_ru)
        filepath = UPLOAD_DIR / filename

        if filepath.exists() and filepath.stat().st_size > 1000:
            print(f"[{i+1}/{len(persons)}] {name_ru} — already exists, skipping")
            updates.append((name_ru, f"/uploads/seed/{filename}"))
            skipped += 1
            continue

        print(f"[{i+1}/{len(persons)}] {name_ru} ({name_orig})")

        image_url = find_image_for_person(name_ru, name_orig)
        if not image_url:
            print(f"    No image found")
            failed += 1
            time.sleep(0.3)
            continue

        if download_image(image_url, filepath):
            print(f"    Saved: {filename} ({filepath.stat().st_size // 1024} KB)")
            updates.append((name_ru, f"/uploads/seed/{filename}"))
            success += 1
        else:
            failed += 1

        time.sleep(0.5)

    print(f"\n{'=' * 60}")
    print(f"Done! Success: {success}, Skipped: {skipped}, Failed: {failed}")
    print(f"{'=' * 60}")

    if updates:
        with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
            f.write("-- Auto-generated: Wikipedia photo URLs for persons\n")
            f.write("-- Run after initial seed to update main_photo_url\n\n")
            for name_ru, photo_path in updates:
                escaped_name = name_ru.replace("'", "''")
                f.write(
                    f"UPDATE persons SET main_photo_url = '{photo_path}' "
                    f"WHERE name = '{escaped_name}' AND main_photo_url = '/uploads/seed/default.jpg';\n"
                )
        print(f"\nGenerated: {OUTPUT_SQL}")
        print(f"Total UPDATE statements: {len(updates)}")


if __name__ == "__main__":
    main()
