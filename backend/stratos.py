from __future__ import annotations

from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
import logging
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union, Any
import uuid
import re
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

import unicodedata

def normalize_answer(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    # Strip diacritics/accents
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    # Remove punctuation
    s = re.sub(r'[.,\/#!$%\^\&\*;:{}=\-_`~()\'\"\[\]]', '', s)
    # Remove all whitespace
    return re.sub(r'\s+', '', s).strip()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Allow an external process (packager) to override the frontend build path.
# When packaged with PyInstaller we'll set FRONTEND_BUILD_DIR env var to the
# location where the static build files are available inside the bundle.
default_frontend_path = ROOT_DIR / 'frontend' / 'build'
if not default_frontend_path.exists():
    # Try one level up if we're in the backend folder during development
    default_frontend_path = ROOT_DIR.parent / 'frontend' / 'build'

FRONTEND_BUILD_DIR = Path(os.environ.get('FRONTEND_BUILD_DIR', default_frontend_path))

# Configure logging to file for production debugging
log_file = ROOT_DIR / "stratos_backend.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Frontend build directory: {FRONTEND_BUILD_DIR}")
logger.info(f"Directory exists: {FRONTEND_BUILD_DIR.exists()}")

# Create FastAPI app before any mounts or decorators
app = FastAPI()

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Serve other frontend static files if present (production build)
if FRONTEND_BUILD_DIR.exists():
    app.mount('/static', StaticFiles(directory=str(FRONTEND_BUILD_DIR / "static")), name='frontend')

# MongoDB connection
# Use the environment variable if present, otherwise default to local MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'stratos')

if mongo_url:
    logger.info(f"Connecting to MongoDB at: {mongo_url}")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db: Optional[Any] = client[db_name]
else:
    logger.warning("MONGO_URL not set and no default available.")
    client = None
    db = None

# Helper to check database availability
async def require_db() -> Any:
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection string not configured.")
    try:
        # Verify connection is actually alive
        await db.command("ping")
        return db
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise HTTPException(
            status_code=503, 
            detail="Could not connect to MongoDB. Please ensure MongoDB is installed and running on localhost:27017"
        )

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'stratos-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    hearts: int = 5
    gems: int = 0
    league: str = "Bronze"
    inventory: List[str] = []
    friends: List[str] = []
    friend_requests: List[str] = []
    active_boosters: List[dict] = [] # e.g. [{"id": "xp-double", "uses_left": 3}]
    current_language: Optional[str] = None
    languages_learning: List[str] = []
    achievements: List[str] = []
    last_practice_date: Optional[str] = None
    created_at: str

class ShopItem(BaseModel):
    id: str
    name: str
    description: str
    cost: int
    icon: str

class GemPackage(BaseModel):
    id: str
    name: str
    amount: int
    price: float
    icon: str

class FriendRequest(BaseModel):
    id: str
    name: str
    level: int
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LanguageInfo(BaseModel):
    code: str
    name: str
    flag: str
    lessons_count: int = 0
    progress: int = 0

class LessonContent(BaseModel):
    type: str  # "multiple_choice", "written", "voice", "flashcard"
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    voice_url: Optional[str] = None
    hint: Optional[str] = None

class Lesson(BaseModel):
    id: str
    language: str
    title: str
    description: str
    order: int
    xp_reward: int = 10
    content: List[LessonContent]

class LessonProgress(BaseModel):
    lesson_id: str
    completed: bool = False
    score: int = 0
    completed_at: Optional[str] = None

class QuizSubmission(BaseModel):
    lesson_id: str
    answers: List[str]
    session_token: Optional[str] = None

class QuizResult(BaseModel):
    correct: int
    total: int
    xp_earned: int
    passed: bool
    new_level: Optional[int] = None
    streak_bonus: int = 0

class FlashcardSet(BaseModel):
    id: str
    language: str
    title: str
    order: int
    cards: List[dict]
    locked: bool = True

class Achievement(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    unlocked: bool = False
    unlocked_at: Optional[str] = None

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    xp: int
    level: int
    streak: int
    league: str = "Bronze"

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
        db_conn = await require_db()
        user = await db_conn.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ SEED DATA ============

LANGUAGES = [
    {"code": "es", "name": "Spanish", "flag": "🇪🇸"},
    {"code": "fr", "name": "French", "flag": "🇫🇷"},
    {"code": "de", "name": "German", "flag": "🇩🇪"},
    {"code": "ja", "name": "Japanese", "flag": "🇯🇵"},
    {"code": "zh", "name": "Chinese", "flag": "🇨🇳"},
    {"code": "it", "name": "Italian", "flag": "🇮🇹"},
    {"code": "pt", "name": "Portuguese", "flag": "🇧🇷"},
    {"code": "ko", "name": "Korean", "flag": "🇰🇷"},
    {"code": "ru", "name": "Russian", "flag": "🇷🇺"},
    {"code": "ar", "name": "Arabic", "flag": "🇸🇦"},
]

# All lessons are generated from the pool builders below.
SAMPLE_LESSONS = {}

# Ensure every language has at least 4 meaningful sample lessons (generate greetings, numbers, colors, phrases)
common_phrases = {
    'es': {
        'hello': 'hola', 'thank': 'gracias', 'goodbye': 'adiós', 'please': 'por favor',
        'yes': 'sí', 'no': 'no', 'sorry': 'lo siento', 'excuse': 'perdón',
        'numbers': ['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'],
        'colors': ['rojo','azul','verde','amarillo','negro','blanco','naranja','morado'],
        'family': {'father': 'padre', 'mother': 'madre', 'brother': 'hermano', 'sister': 'hermana'},
        'travel': {'airport': 'aeropuerto', 'hotel': 'hotel', 'ticket': 'boleto', 'map': 'mapa'},
        'food': {'bread': 'pan', 'milk': 'leche', 'water': 'agua', 'apple': 'manzana'},
        'time': {'today': 'hoy', 'tomorrow': 'mañana', 'now': 'ahora', 'later': 'más tarde'}
    },
    'fr': {
        'hello': 'bonjour', 'thank': 'merci', 'goodbye': 'au revoir', 'please': "s'il vous plaît",
        'yes': 'oui', 'no': 'non', 'sorry': 'pardon', 'excuse': 'excusez-moi',
        'numbers': ['un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix'],
        'colors': ['rouge','bleu','vert','jaune','noir','blanc','orange','violet'],
        'family': {'father': 'père', 'mother': 'mère', 'brother': 'frère', 'sister': 'sœur'},
        'travel': {'airport': 'aéroport', 'hotel': 'hôtel', 'ticket': 'billet', 'map': 'carte'},
        'food': {'bread': 'pain', 'milk': 'lait', 'water': 'eau', 'apple': 'pomme'},
        'time': {'today': "aujourd'hui", 'tomorrow': 'demain', 'now': 'maintenant', 'later': 'plus tard'}
    },
    'de': {
        'hello': 'hallo', 'thank': 'danke', 'goodbye': 'auf wiedersehen', 'please': 'bitte',
        'yes': 'ja', 'no': 'nein', 'sorry': 'tut mir leid', 'excuse': 'entschuldigung',
        'numbers': ['eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn'],
        'colors': ['rot','blau','grün','gelb','schwarz','weiß','orange','lila'],
        'family': {'father': 'vater', 'mother': 'mutter', 'brother': 'bruder', 'sister': 'schwester'},
        'travel': {'airport': 'flughafen', 'hotel': 'hotel', 'ticket': 'ticket', 'map': 'karte'},
        'food': {'bread': 'brot', 'milk': 'milch', 'water': 'wasser', 'apple': 'apfel'},
        'time': {'today': 'heute', 'tomorrow': 'morgen', 'now': 'jetzt', 'later': 'später'}
    },
    'ja': {
        'hello': 'konnichiwa', 'thank': 'arigatou', 'goodbye': 'sayounara', 'please': 'onegaishimasu',
        'yes': 'hai', 'no': 'iie', 'sorry': 'gomennasai', 'excuse': 'sumimasen',
        'numbers': ['ichi','ni','san','shi','go','roku','shichi','hachi','kyuu','juu'],
        'colors': ['aka','ao','midori','ki','kuro','shiro','daidai','murasaki'],
        'family': {'father': 'otousan', 'mother': 'okaasan', 'brother': 'oniisan', 'sister': 'oneesan'},
        'travel': {'airport': 'kuukou', 'hotel': 'hoteru', 'ticket': 'kippu', 'map': 'chizu'},
        'food': {'bread': 'pan', 'milk': 'miruku', 'water': 'mizu', 'apple': 'ringo'},
        'time': {'today': 'kyou', 'tomorrow': 'ashita', 'now': 'ima', 'later': 'ato de'}
    },
    'zh': {
        'hello': 'nǐ hǎo', 'thank': 'xièxie', 'goodbye': 'zàijiàn', 'please': 'qǐng',
        'yes': 'shì', 'no': 'bù', 'sorry': 'duìbuqǐ', 'excuse': 'qǐngwèn',
        'numbers': ['yi','er','san','si','wu','liu','qi','ba','jiu','shi'],
        'colors': ['hóng','lán','lǜ','huáng','hēi','bái','chéng','zǐ'],
        'family': {'father': 'bàba', 'mother': 'māmā', 'brother': 'gēgē', 'sister': 'jiějiě'},
        'travel': {'airport': 'jīchǎng', 'hotel': 'jiǔdiàn', 'ticket': 'piào', 'map': 'dìtú'},
        'food': {'bread': 'miànbāo', 'milk': 'niúnǎi', 'water': 'shuǐ', 'apple': 'píngguǒ'},
        'time': {'today': 'jīntiān', 'tomorrow': 'míngtiān', 'now': 'xiànzài', 'later': 'shāohòu'}
    },
    'it': {
        'hello': 'ciao', 'thank': 'grazie', 'goodbye': 'arrivederci', 'please': 'per favore',
        'yes': 'sì', 'no': 'no', 'sorry': 'scusa', 'excuse': 'scusi',
        'numbers': ['uno','due','tre','quattro','cinque','sei','sette','otto','nove','dieci'],
        'colors': ['rosso','blu','verde','giallo','nero','bianco','arancione','viola'],
        'family': {'father': 'padre', 'mother': 'madre', 'brother': 'fratello', 'sister': 'sorella'},
        'travel': {'airport': 'aeroporto', 'hotel': 'hotel', 'ticket': 'biglietto', 'map': 'mappa'},
        'food': {'bread': 'pane', 'milk': 'latte', 'water': 'acqua', 'apple': 'mela'},
        'time': {'today': 'oggi', 'tomorrow': 'domani', 'now': 'ora', 'later': 'più tardi'}
    },
    'pt': {
        'hello': 'olá', 'thank': 'obrigado', 'goodbye': 'adeus', 'please': 'por favor',
        'yes': 'sim', 'no': 'não', 'sorry': 'desculpe', 'excuse': 'com licença',
        'numbers': ['um','dois','três','quatro','cinco','seis','sete','oito','nove','dez'],
        'colors': ['vermelho','azul','verde','amarelo','preto','branco','laranja','roxo'],
        'family': {'father': 'pai', 'mother': 'mãe', 'brother': 'irmão', 'sister': 'irmã'},
        'travel': {'airport': 'aeroporto', 'hotel': 'hotel', 'ticket': 'bilhete', 'map': 'mapa'},
        'food': {'bread': 'pão', 'milk': 'leche', 'water': 'água', 'apple': 'maçã'},
        'time': {'today': 'hoje', 'tomorrow': 'amanhã', 'now': 'agora', 'later': 'mais tarde'}
    },
    'ko': {
        'hello': 'annyeong', 'thank': 'gamsahamnida', 'goodbye': 'annyeonghi gaseyo', 'please': 'butakamnida',
        'yes': 'ne', 'no': 'aniyo', 'sorry': 'mianhaeyo', 'excuse': 'silyehamnida',
        'numbers': ['hana','dul','set','net','daseot','yeoseot','ilgop','yeodal','ahop','yeol'],
        'colors': ['ppalgan','paran','nok','hwang','geomjeong','hayan','juhwang','bora'],
        'family': {'father': 'abeoji', 'mother': 'eomeoni', 'brother': 'hyeong', 'sister': 'nuna'},
        'travel': {'airport': 'gonghang', 'hotel': 'hotel', 'ticket': 'pyo', 'map': 'jido'},
        'food': {'bread': 'ppang', 'milk': 'uyu', 'water': 'mul', 'apple': 'sagwa'},
        'time': {'today': 'oneul', 'tomorrow': 'naeil', 'now': 'jigeum', 'later': 'najunge'}
    },
    'ru': {
        'hello': 'privet', 'thank': 'spasibo', 'goodbye': 'do svidaniya', 'please': 'pozhaluysta',
        'yes': 'da', 'no': 'nyet', 'sorry': 'izvinite', 'excuse': 'prostite',
        'numbers': ['odin','dva','tri','chetyre','pyat','shest','sem','vosem','devyat','desyat'],
        'colors': ['krasnyy','siniy','zelyonyy','zholtyy','chernyy','belyy','oranzhevyy','fioletovyy'],
        'family': {'father': 'otez', 'mother': 'mat', 'brother': 'brat', 'sister': 'sestra'},
        'travel': {'airport': 'aeroport', 'hotel': 'otel', 'ticket': 'bilet', 'map': 'karta'},
        'food': {'bread': 'khleb', 'milk': 'moloko', 'water': 'voda', 'apple': 'yabloko'},
        'time': {'today': 'segodnya', 'tomorrow': 'zavtra', 'now': 'seychas', 'later': 'pozzhe'}
    },
    'ar': {
        'hello': 'marhaba', 'thank': 'shukran', 'goodbye': 'maʿa s-salāma', 'please': 'min fadlak',
        'yes': 'na’am', 'no': 'laa', 'sorry': 'aasif', 'excuse': 'al-ma’dhirah',
        'numbers': ['wahid','ithnan','thalatha','arbaʿa','khamsa','sitta','sab\'a','thamaniya','tis\'a','ashara'],
        'colors': ['ahmar','azraq','akhḍar','asfar','aswad','abyad','burtuqaali','banafsaji'],
        'family': {'father': 'ab', 'mother': 'umm', 'brother': 'akh', 'sister': 'ukht'},
        'travel': {'airport': 'mataar', 'hotel': 'funduq', 'ticket': 'tadhkira', 'map': 'kharita'},
        'food': {'bread': 'khubz', 'milk': 'haleeb', 'water': 'maa', 'apple': 'tuffah'},
        'time': {'today': 'al-yawm', 'tomorrow': 'ghadan', 'now': 'al-aan', 'later': 'laahiqan'}
    },
}

import random

# ── In-memory session store ──────────────────────────────────────────────────
# Maps session_token -> list of question dicts selected for that play-through.
# Consumed (deleted) once the lesson is submitted for grading.
_lesson_sessions: dict = {}


# ── Per-lesson question pool builders ────────────────────────────────────────

def build_greetings_pool(code, name, data):
    hello   = data.get('hello',   'hello')
    goodbye = data.get('goodbye', 'goodbye')
    thank   = data.get('thank',   'thank you')
    please  = data.get('please',  'please')
    return [
        {'type': 'voice',           'question': f'Listen and repeat: {hello}',              'correct_answer': hello,   'hint': 'Hello'},
        {'type': 'multiple_choice', 'question': f"What does '{hello}' mean?",               'options': ['Goodbye','Hello','Thank you','Please'],    'correct_answer': 'Hello'},
        {'type': 'written',         'question': f"Write 'Hello' in {name}",                 'correct_answer': hello,   'hint': f"Starts with '{hello[0].upper()}'"},
        {'type': 'multiple_choice', 'question': f"How do you say 'Goodbye' in {name}?",    'options': [goodbye, hello, thank, please],             'correct_answer': goodbye},
        {'type': 'written',         'question': f"Write 'Thank you' in {name}",             'correct_answer': thank,   'hint': f"Starts with '{thank[0].upper()}'"},
        {'type': 'multiple_choice', 'question': f"What does '{thank}' mean?",               'options': ['Hello','Goodbye','Thank you','Please'],    'correct_answer': 'Thank you'},
        {'type': 'multiple_choice', 'question': f"'{please}' means:",                       'options': ['Thank you','Hello','Goodbye','Please'],    'correct_answer': 'Please'},
        {'type': 'written',         'question': f"Write 'Please' in {name}",                'correct_answer': please,  'hint': f"Starts with '{please[0].upper()}'"},
        {'type': 'multiple_choice', 'question': f"What does '{goodbye}' mean?",             'options': ['Hello','Thank you','Goodbye','Please'],    'correct_answer': 'Goodbye'},
        {'type': 'voice',           'question': f'Listen and repeat: {goodbye}',            'correct_answer': goodbye, 'hint': 'Goodbye'},
        {'type': 'multiple_choice', 'question': f"Which of these is a greeting in {name}?",'options': [hello, 'pizza','taxi','hotel'],              'correct_answer': hello},
        {'type': 'written',         'question': f"Write 'Goodbye' in {name}",               'correct_answer': goodbye, 'hint': f"Starts with '{goodbye[0].upper()}'"},
    ]

def build_numbers_pool(code, name, data):
    n = data.get('numbers', ['one','two','three','four','five','six','seven','eight','nine','ten'])
    return [
        {'type': 'voice',           'question': f'Listen: {n[0]}, {n[1]}, {n[2]}',          'correct_answer': f'{n[0]} {n[1]} {n[2]}', 'hint': '1, 2, 3'},
        {'type': 'multiple_choice', 'question': f"What is '{n[0]}' in English?",             'options': ['One','Two','Three','Four'],    'correct_answer': 'One'},
        {'type': 'multiple_choice', 'question': f"What is '{n[1]}' in English?",             'options': ['One','Two','Three','Four'],    'correct_answer': 'Two'},
        {'type': 'multiple_choice', 'question': f"What is '{n[2]}' in English?",             'options': ['One','Two','Three','Four'],    'correct_answer': 'Three'},
        {'type': 'written',         'question': f"Write the number 1 in {name}",             'correct_answer': n[0], 'hint': f"'{n[0]}'"},
        {'type': 'written',         'question': f"Write the number 5 in {name}",             'correct_answer': n[4], 'hint': f"'{n[4]}'"},
        {'type': 'written',         'question': f"Write the number 3 in {name}",             'correct_answer': n[2], 'hint': f"'{n[2]}'"},
        {'type': 'multiple_choice', 'question': f"What is '{n[4]}' in English?",             'options': ['Three','Four','Five','Six'],   'correct_answer': 'Five'},
        {'type': 'multiple_choice', 'question': f"What is '{n[6]}' in English?",             'options': ['Five','Six','Seven','Eight'], 'correct_answer': 'Seven'},
        {'type': 'written',         'question': f"Write the number 7 in {name}",             'correct_answer': n[6], 'hint': f"'{n[6]}'"},
        {'type': 'multiple_choice', 'question': f"What comes after '{n[1]}' in {name}?",    'options': [n[0],n[2],n[3],n[4]],         'correct_answer': n[2]},
        {'type': 'multiple_choice', 'question': f"What comes before '{n[4]}' in {name}?",   'options': [n[2],n[3],n[5],n[6]],         'correct_answer': n[3]},
        {'type': 'written',         'question': f"Write the number 10 in {name}",            'correct_answer': n[9], 'hint': f"'{n[9]}'"},
        {'type': 'multiple_choice', 'question': f"Which number is '{n[9]}'?",                'options': ['Eight','Nine','Ten','Seven'], 'correct_answer': 'Ten'},
    ]

def build_colors_pool(code, name, data):
    c = data.get('colors', ['red','blue','green','yellow','black','white','orange','purple'])
    return [
        {'type': 'voice',           'question': f"Listen: {c[0]} means Red",               'correct_answer': c[0], 'hint': 'Red'},
        {'type': 'multiple_choice', 'question': f"What color is '{c[0]}'?",                'options': ['Red','Blue','Green','Yellow'],   'correct_answer': 'Red'},
        {'type': 'multiple_choice', 'question': f"What color is '{c[1]}'?",                'options': ['Red','Blue','Green','Yellow'],   'correct_answer': 'Blue'},
        {'type': 'multiple_choice', 'question': f"What color is '{c[2]}'?",                'options': ['Red','Blue','Green','Yellow'],   'correct_answer': 'Green'},
        {'type': 'multiple_choice', 'question': f"What color is '{c[3]}'?",                'options': ['Red','Blue','Yellow','Black'],   'correct_answer': 'Yellow'},
        {'type': 'written',         'question': f"Write 'Red' in {name}",                  'correct_answer': c[0], 'hint': f"'{c[0]}'"},
        {'type': 'written',         'question': f"Write 'Blue' in {name}",                 'correct_answer': c[1], 'hint': f"'{c[1]}'"},
        {'type': 'written',         'question': f"Write 'Green' in {name}",                'correct_answer': c[2], 'hint': f"'{c[2]}'"},
        {'type': 'written',         'question': f"Write 'Yellow' in {name}",               'correct_answer': c[3], 'hint': f"'{c[3]}'"},
        {'type': 'multiple_choice', 'question': f"How do you say 'Black' in {name}?",      'options': [c[4],c[0],c[2],c[6]],           'correct_answer': c[4]},
        {'type': 'multiple_choice', 'question': f"How do you say 'White' in {name}?",      'options': [c[4],c[5],c[6],c[2]],           'correct_answer': c[5]},
        {'type': 'written',         'question': f"Write 'Black' in {name}",                'correct_answer': c[4], 'hint': f"'{c[4]}'"},
        {'type': 'multiple_choice', 'question': f"What color is '{c[6]}'?",                'options': ['Red','Purple','Orange','Yellow'],'correct_answer': 'Orange'},
        {'type': 'multiple_choice', 'question': f"What color is '{c[7]}'?",                'options': ['Blue','Purple','Orange','Black'],'correct_answer': 'Purple'},
    ]

def build_phrases_pool(code, name, data):
    yes    = data.get('yes',    'yes')
    no     = data.get('no',     'no')
    sorry  = data.get('sorry',  'sorry')
    excuse = data.get('excuse', 'excuse me')
    return [
        {'type': 'written',         'question': f"How do you say 'Yes' in {name}?",         'correct_answer': yes,    'hint': f"'{yes}'"},
        {'type': 'written',         'question': f"How do you say 'No' in {name}?",          'correct_answer': no,     'hint': f"'{no}'"},
        {'type': 'written',         'question': f"Write 'Sorry' in {name}",                 'correct_answer': sorry,  'hint': f"'{sorry}'"},
        {'type': 'written',         'question': f"Write 'Excuse me' in {name}",             'correct_answer': excuse, 'hint': f"'{excuse}'"},
        {'type': 'multiple_choice', 'question': f"What does '{yes}' mean?",                 'options': ['Yes','No','Maybe','Please'],   'correct_answer': 'Yes'},
        {'type': 'multiple_choice', 'question': f"What does '{no}' mean?",                  'options': ['Yes','No','Maybe','Thank you'],'correct_answer': 'No'},
        {'type': 'multiple_choice', 'question': f"How do you say 'Sorry' in {name}?",       'options': [sorry, excuse, 'hola', 'si'],   'correct_answer': sorry},
        {'type': 'multiple_choice', 'question': f"How do you say 'Excuse me' in {name}?",   'options': [excuse, sorry, 'no', 'por favor'], 'correct_answer': excuse},
        {'type': 'voice',           'question': f"Listen and repeat: {sorry}",              'correct_answer': sorry,  'hint': 'Sorry'},
        {'type': 'voice',           'question': f"Listen and repeat: {excuse}",             'correct_answer': excuse, 'hint': 'Excuse me'},
    ]

def build_family_pool(code, name, data):
    fam     = data.get('family', {})
    father  = fam.get('father',  'father')
    mother  = fam.get('mother',  'mother')
    brother = fam.get('brother', 'brother')
    sister  = fam.get('sister',  'sister')
    return [
        {'type': 'multiple_choice', 'question': f"How do you say 'Mother' in {name}?",         'options': [mother,father,brother,sister], 'correct_answer': mother},
        {'type': 'multiple_choice', 'question': f"How do you say 'Father' in {name}?",         'options': [mother,father,brother,sister], 'correct_answer': father},
        {'type': 'written',         'question': f"Write 'Father' in {name}",                    'correct_answer': father,  'hint': f"'{father}'"},
        {'type': 'written',         'question': f"Write 'Mother' in {name}",                    'correct_answer': mother,  'hint': f"'{mother}'"},
        {'type': 'multiple_choice', 'question': f"'{brother}' means:",                          'options': ['Sister','Brother','Uncle','Grandfather'], 'correct_answer': 'Brother'},
        {'type': 'multiple_choice', 'question': f"'{sister}' means:",                           'options': ['Mother','Aunt','Sister','Grandmother'],   'correct_answer': 'Sister'},
        {'type': 'written',         'question': f"Write 'Brother' in {name}",                   'correct_answer': brother, 'hint': f"'{brother}'"},
        {'type': 'written',         'question': f"Write 'Sister' in {name}",                    'correct_answer': sister,  'hint': f"'{sister}'"},
        {'type': 'multiple_choice', 'question': f"Who is your parent in {name}?",               'options': [mother,'friend','teacher','boss'], 'correct_answer': mother},
        {'type': 'multiple_choice', 'question': f"'{father}' refers to your:",                  'options': ['Mother','Father','Brother','Sister'], 'correct_answer': 'Father'},
        {'type': 'multiple_choice', 'question': f"Which word means a female sibling in {name}?",'options': [brother,sister,mother,father],         'correct_answer': sister},
    ]

def build_travel_pool(code, name, data):
    tr      = data.get('travel', {})
    airport = tr.get('airport', 'airport')
    hotel   = tr.get('hotel',   'hotel')
    ticket  = tr.get('ticket',  'ticket')
    map_    = tr.get('map',     'map')
    return [
        {'type': 'multiple_choice', 'question': f"Where would you go to catch a flight in {name}?",  'options': [airport,hotel,'beach','park'],       'correct_answer': airport},
        {'type': 'written',         'question': f"How do you say 'Ticket' in {name}?",               'correct_answer': ticket,  'hint': f"'{ticket}'"},
        {'type': 'multiple_choice', 'question': f"You need a '{map_}' to find your way. What is it?", 'options': ['Compass','Phone','Map','Guide'],    'correct_answer': 'Map'},
        {'type': 'multiple_choice', 'question': f"Where do you sleep when traveling in {name}?",     'options': [hotel,airport,ticket,map_],          'correct_answer': hotel},
        {'type': 'written',         'question': f"Write 'Airport' in {name}",                         'correct_answer': airport, 'hint': f"'{airport}'"},
        {'type': 'written',         'question': f"Write 'Hotel' in {name}",                           'correct_answer': hotel,   'hint': f"'{hotel}'"},
        {'type': 'multiple_choice', 'question': f"'{ticket}' means:",                                 'options': ['Hotel','Map','Ticket','Airport'],   'correct_answer': 'Ticket'},
        {'type': 'multiple_choice', 'question': f"'{airport}' means:",                                'options': ['Hotel','Airport','Map','Station'],  'correct_answer': 'Airport'},
        {'type': 'written',         'question': f"Write 'Map' in {name}",                             'correct_answer': map_,    'hint': f"'{map_}'"},
        {'type': 'multiple_choice', 'question': f"You need '{ticket}' to board a train. What is it?", 'options': ['A passport','A ticket','A map','A bag'], 'correct_answer': 'A ticket'},
    ]

def build_food_pool(code, name, data):
    f     = data.get('food', {})
    bread = f.get('bread', 'bread')
    milk  = f.get('milk',  'milk')
    water = f.get('water', 'water')
    apple = f.get('apple', 'apple')
    return [
        {'type': 'multiple_choice', 'question': f"How do you say 'Water' in {name}?",  'options': [water,'juice','wine','soda'],      'correct_answer': water},
        {'type': 'written',         'question': f"Write 'Bread' in {name}",             'correct_answer': bread, 'hint': f"'{bread}'"},
        {'type': 'multiple_choice', 'question': f"'{milk}' means:",                     'options': ['Bread','Water','Milk','Apple'],   'correct_answer': 'Milk'},
        {'type': 'multiple_choice', 'question': f"What beverage is '{water}'?",         'options': ['Juice','Water','Milk','Coffee'],  'correct_answer': 'Water'},
        {'type': 'written',         'question': f"Write 'Water' in {name}",             'correct_answer': water, 'hint': f"'{water}'"},
        {'type': 'written',         'question': f"Write 'Milk' in {name}",              'correct_answer': milk,  'hint': f"'{milk}'"},
        {'type': 'multiple_choice', 'question': f"'{bread}' is a type of:",             'options': ['Drink','Fruit','Bread','Vegetable'], 'correct_answer': 'Bread'},
        {'type': 'multiple_choice', 'question': f"How do you say 'Apple' in {name}?",  'options': [apple,bread,milk,water],          'correct_answer': apple},
        {'type': 'written',         'question': f"Write 'Apple' in {name}",             'correct_answer': apple, 'hint': f"'{apple}'"},
        {'type': 'multiple_choice', 'question': f"'{apple}' is a:",                     'options': ['Vegetable','Drink','Bread','Fruit'], 'correct_answer': 'Fruit'},
        {'type': 'multiple_choice', 'question': f"Which of these is a drink in {name}?",'options': [water,bread,apple,'table'],       'correct_answer': water},
    ]

def build_time_pool(code, name, data):
    t        = data.get('time', {})
    today    = t.get('today',    'today')
    tomorrow = t.get('tomorrow', 'tomorrow')
    now      = t.get('now',      'now')
    later    = t.get('later',    'later')
    return [
        {'type': 'multiple_choice', 'question': f"How do you say 'Today' in {name}?",    'options': [today,tomorrow,now,later],         'correct_answer': today},
        {'type': 'written',         'question': f"How do you say 'Now' in {name}?",      'correct_answer': now,      'hint': f"'{now}'"},
        {'type': 'multiple_choice', 'question': f"'{later}' means:",                     'options': ['Now','Never','Later','Always'],    'correct_answer': 'Later'},
        {'type': 'multiple_choice', 'question': f"How do you say 'Tomorrow' in {name}?",'options': [now,today,later,tomorrow],          'correct_answer': tomorrow},
        {'type': 'written',         'question': f"Write 'Today' in {name}",              'correct_answer': today,    'hint': f"'{today}'"},
        {'type': 'written',         'question': f"Write 'Tomorrow' in {name}",           'correct_answer': tomorrow, 'hint': f"'{tomorrow}'"},
        {'type': 'multiple_choice', 'question': f"'{today}' means:",                     'options': ['Yesterday','Tomorrow','Today','Later'],   'correct_answer': 'Today'},
        {'type': 'multiple_choice', 'question': f"'{now}' means:",                       'options': ['Later','Never','Now','Today'],    'correct_answer': 'Now'},
        {'type': 'written',         'question': f"Write 'Later' in {name}",              'correct_answer': later,    'hint': f"'{later}'"},
        {'type': 'multiple_choice', 'question': f"'{tomorrow}' means:",                  'options': ['Today','Yesterday','Now','Tomorrow'], 'correct_answer': 'Tomorrow'},
        {'type': 'multiple_choice', 'question': f"If today is Monday, '{tomorrow}' is:", 'options': ['Sunday','Monday','Tuesday','Wednesday'], 'correct_answer': 'Tuesday'},
    ]


_POOL_BUILDERS = [
    ('Greetings',      'Basic greetings and farewells',          15, build_greetings_pool),
    ('Numbers',        'Count from 1 to 10',                     15, build_numbers_pool),
    ('Colors',         'Common colors vocabulary',               15, build_colors_pool),
    ('Useful Phrases', 'Polite everyday expressions',            20, build_phrases_pool),
    ('Family Members', 'Vocabulary for family relationships',    20, build_family_pool),
    ('Travel',         'Essential words for traveling',          25, build_travel_pool),
    ('Food & Drink',   'Common food and drink vocabulary',       20, build_food_pool),
    ('Time',           'Expressing time and days',               20, build_time_pool),
]

for lang in LANGUAGES:
    code = lang['code']
    name = lang['name']
    data = common_phrases.get(code, {})
    if code not in SAMPLE_LESSONS:
        SAMPLE_LESSONS[code] = []
    existing_orders = {l['order'] for l in SAMPLE_LESSONS[code]}
    for order, (title, desc, xp, builder) in enumerate(_POOL_BUILDERS, start=1):
        if order in existing_orders:
            # Upgrade any pre-existing lessons to use a question_pool
            for l in SAMPLE_LESSONS[code]:
                if l['order'] == order and 'question_pool' not in l:
                    l['question_pool'] = builder(code, name, data)
            continue
        lesson_id = f"{code}-{title.lower().replace(' ', '-').replace('&', 'and')}-{order}"
        SAMPLE_LESSONS[code].append({
            'id':            lesson_id,
            'language':      code,
            'title':         title,
            'description':   f'{desc} in {name}',
            'order':         order,
            'xp_reward':     xp,
            'question_pool': builder(code, name, data),
        })

# Removed redundant FLASHCARD_SETS dictionary. Flashcards are now generated dynamically.

ACHIEVEMENTS = [
    {"id": "first-lesson", "name": "First Steps", "description": "Complete your first lesson", "icon": "baby"},
    {"id": "lesson-5", "name": "Consistent Learner", "description": "Complete 5 different lessons", "icon": "book"},
    {"id": "lesson-20", "name": "Dedicated Scholar", "description": "Complete 20 different lessons", "icon": "library"},
    {"id": "streak-3", "name": "On Fire", "description": "Maintain a 3-day streak", "icon": "flame"},
    {"id": "streak-7", "name": "Week Warrior", "description": "Maintain a 7-day streak", "icon": "calendar"},
    {"id": "streak-30", "name": "Monthly Master", "description": "Maintain a 30-day streak", "icon": "trophy"},
    {"id": "streak-100", "name": "Centurion", "description": "Maintain a legendary 100-day streak", "icon": "shield"},
    {"id": "xp-100", "name": "Century Club", "description": "Earn 100 total XP", "icon": "zap"},
    {"id": "xp-500", "name": "XP Master", "description": "Earn 500 total XP", "icon": "star"},
    {"id": "xp-5000", "name": "Titan", "description": "Earn a massive 5000 total XP", "icon": "gem"},
    {"id": "xp-1000", "name": "Legend", "description": "Earn 1000 total XP", "icon": "crown"},
    {"id": "perfect-lesson", "name": "Perfectionist", "description": "Complete any lesson with 100% accuracy", "icon": "target"},
    {"id": "perfect-5", "name": "Sniper", "description": "Complete 5 different lessons with 100% accuracy", "icon": "crosshair"},
    {"id": "multi-language", "name": "Polyglot", "description": "Start your journey in at least 3 different languages", "icon": "globe"},
    {"id": "lang-5", "name": "Global Talker", "description": "Explore the world by learning 5 different languages", "icon": "map_pin"},
    {"id": "level-5", "name": "Rising Star", "description": "Reach Level 5 by earning XP", "icon": "sparkles"},
    {"id": "level-10", "name": "Expert Learner", "description": "Reach Level 10 - a true language master", "icon": "award"},
]

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    db_conn = await require_db()
    existing = await db_conn.users.find_one({'email': user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'name': user_data.name,
        'password': hash_password(user_data.password),
        'xp': 0,
        'level': 1,
        'streak': 0,
        'hearts': 5,
        'gems': 0,
        'league': 'Bronze',
        'inventory': [],
        'friends': [],
        'friend_requests': [],
        'active_boosters': [],
        'current_language': None,
        'languages_learning': [],
        'achievements': [],
        'last_practice_date': None,
        'created_at': now
    }
    
    await db_conn.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_response = UserResponse(**{k: v for k, v in user_doc.items() if k != 'password'})
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db_conn = await require_db()
    user = await db_conn.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user['id'])
    user_response = UserResponse(**{k: v for k, v in user.items() if k != 'password'})
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in user.items() if k != 'password'})

# ============ LANGUAGE ROUTES ============

@api_router.get("/languages", response_model=List[LanguageInfo])
async def get_languages(user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    result = []
    for lang in LANGUAGES:
        lessons = SAMPLE_LESSONS.get(lang['code'], [])
        progress_docs = await db_conn.lesson_progress.find({
            'user_id': user['id'],
            'language': lang['code'],
            'completed': True
        }, {'_id': 0}).to_list(100)
        
        progress_pct = int((len(progress_docs) / max(len(lessons), 1)) * 100) if lessons else 0
        
        result.append(LanguageInfo(
            code=lang['code'],
            name=lang['name'],
            flag=lang['flag'],
            lessons_count=len(lessons),
            progress=progress_pct
        ))
    return result

@api_router.post("/languages/{code}/start")
async def start_language(code: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    lang = next((l for l in LANGUAGES if l['code'] == code), None)
    if not lang:
        raise HTTPException(status_code=404, detail="Language not found")
    
    languages = user.get('languages_learning', [])
    if code not in languages:
        languages.append(code)
    
    await db_conn.users.update_one(
        {'id': user['id']},
        {'$set': {'current_language': code, 'languages_learning': languages}}
    )
    
    # Check polyglot achievement
    if len(languages) >= 3:
        await check_and_award_achievement(user['id'], 'multi-language')
    
    return {"message": f"Started learning {lang['name']}", "language": lang}

# ============ LESSON ROUTES ============

@api_router.get("/lessons/{language}", response_model=List[dict])
async def get_lessons(language: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    lessons = SAMPLE_LESSONS.get(language, [])
    
    # Get user progress
    progress_docs = await db_conn.lesson_progress.find({
        'user_id': user['id'],
        'language': language
    }, {'_id': 0}).to_list(100)
    
    progress_map = {p['lesson_id']: p for p in progress_docs}
    
    result = []
    for lesson in lessons:
        lesson_data = {
            'id': lesson['id'],
            'title': lesson['title'],
            'description': lesson['description'],
            'order': lesson['order'],
            'xp_reward': lesson['xp_reward'],
            'completed': progress_map.get(lesson['id'], {}).get('completed', False),
            'score': progress_map.get(lesson['id'], {}).get('score', 0),
            'locked': False,
        }
        # First lesson always unlocked
        if lesson['order'] == 1:
            lesson_data['locked'] = False
        else:
            # Lesson is locked if previous-order lessons are not completed
            if lesson['order'] > 1:
                prev_ids = {l['id'] for l in lessons if l.get('order') == lesson['order'] - 1}
                lesson_data['locked'] = not any(progress_map.get(pid, {}).get('completed', False) for pid in prev_ids)
        result.append(lesson_data)
    
    return result

@api_router.get("/lessons/{language}/{lesson_id}")
async def get_lesson_detail(language: str, lesson_id: str, user: dict = Depends(get_current_user)):
    lessons = SAMPLE_LESSONS.get(language, [])
    lesson = next((l for l in lessons if l['id'] == lesson_id), None)

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    pool = lesson.get('question_pool', lesson.get('content', []))
    n_pick = min(6, len(pool))
    selected = random.sample(pool, n_pick) if len(pool) > n_pick else list(pool)

    session_token = str(uuid.uuid4())
    _lesson_sessions[session_token] = selected

    return {
        **{k: v for k, v in lesson.items() if k not in ('question_pool', 'content')},
        'content': selected,
        'session_token': session_token,
    }

@api_router.post("/lessons/{language}/{lesson_id}/complete", response_model=QuizResult)
async def complete_lesson(language: str, lesson_id: str, submission: QuizSubmission, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    lessons = SAMPLE_LESSONS.get(language, [])
    lesson = next((l for l in lessons if l['id'] == lesson_id), None)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Retrieve the exact questions shown to the user via session token
    session_questions = None
    if submission.session_token and submission.session_token in _lesson_sessions:
        session_questions = _lesson_sessions.pop(submission.session_token)
    if session_questions is None:
        # Fallback: use full pool (first 6)
        pool = lesson.get('question_pool', lesson.get('content', []))
        session_questions = pool[:6]

    # Calculate score
    correct = 0
    for i, answer in enumerate(submission.answers):
        if i < len(session_questions):
            expected = normalize_answer(session_questions[i]['correct_answer'])
            if normalize_answer(answer) == expected:
                correct += 1
    
    total = len(session_questions)
    score_pct = int((correct / total) * 100) if total else 0
    passed = score_pct >= 70
    
    # Calculate XP and Gems
    base_xp = lesson['xp_reward'] if passed else lesson['xp_reward'] // 2
    gems_earned = 10 if passed else 2
    if score_pct == 100:
        base_xp += 5
        gems_earned += 5
    
    # Update streak
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    last_practice = user.get('last_practice_date')
    
    new_streak = user.get('streak', 0)
    if last_practice:
        last_date = datetime.fromisoformat(last_practice).date()
        days_diff = (now.date() - last_date).days
        if days_diff == 1:
            new_streak += 1
        elif days_diff > 1:
            new_streak = 1
        # Same day: keep streak
    else:
        new_streak = 1
    
    streak_bonus = 0
    if new_streak >= 3: streak_bonus = 2
    if new_streak >= 7: streak_bonus = 5
    if new_streak >= 30: streak_bonus = 15
    
    total_xp = base_xp + streak_bonus
    
    # Apply Boosters
    active_boosters = user.get('active_boosters', [])
    boost_multiplier = 1
    new_boosters = []
    
    for boost in active_boosters:
        if boost['id'] == 'xp-double' and boost['uses_left'] > 0:
            boost_multiplier = 2
            boost['uses_left'] -= 1
        if boost['uses_left'] > 0:
            new_boosters.append(boost)
            
    total_xp *= boost_multiplier
    
    # Update user's XP, gems, streak, and last practice date
    await db_conn.users.update_one(
        {'id': user['id']},
        {
            '$inc': {'xp': total_xp, 'gems': gems_earned},
            '$set': {
                'streak': new_streak, 
                'last_practice_date': today,
                'active_boosters': new_boosters
            }
        }
    )
    
    # Check for level up
    new_xp = (user.get('xp', 0)) + total_xp
    old_level = user.get('level', 1)
    new_level = (new_xp // 100) + 1
    
    if new_level > old_level:
        await db_conn.users.update_one({'id': user['id']}, {'$set': {'level': new_level, 'hearts': 5}})
    
    # Deduct heart if failed
    if not passed:
        hearts = user.get('hearts', 5)
        if hearts > 0:
            await db_conn.users.update_one({'id': user['id']}, {'$inc': {'hearts': -1}})
    
    # Save progress
    await db_conn.lesson_progress.update_one(
        {'user_id': user['id'], 'lesson_id': lesson_id},
        {'$set': {
            'user_id': user['id'],
            'lesson_id': lesson_id,
            'language': language,
            'completed': passed,
            'score': score_pct,
            'completed_at': now.isoformat()
        }},
        upsert=True
    )
    
    await check_lesson_achievements(user['id'], new_streak, new_xp, new_level, score_pct == 100)
    
    return QuizResult(
        correct=correct,
        total=total,
        xp_earned=total_xp,
        passed=passed,
        new_level=new_level if new_level > old_level else None,
        streak_bonus=streak_bonus,
        gems_earned=gems_earned
    )

# ============ FLASHCARD ROUTES ============

def _build_flashcards_for_lesson(title: str, code: str) -> list:
    """Return a list of unique {front, back} dicts for the given lesson title."""
    data = common_phrases.get(code, {})
    title_lower = title.lower()

    if 'greeting' in title_lower or 'salutation' in title_lower or 'begrüß' in title_lower or 'あいさつ' in title_lower:
        h = data.get('hello', ''); g = data.get('goodbye', '')
        t = data.get('thank', ''); p = data.get('please', '')
        return [
            {'front': 'Hello',    'back': h} if h else None,
            {'front': 'Goodbye',  'back': g} if g else None,
            {'front': 'Thank you','back': t} if t else None,
            {'front': 'Please',   'back': p} if p else None,
        ]

    if 'number' in title_lower:
        nums = data.get('numbers', [])
        english = ['One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten']
        return [{'front': english[i], 'back': nums[i]} for i in range(min(len(english), len(nums)))]

    if 'color' in title_lower or 'colour' in title_lower:
        cols = data.get('colors', [])
        english = ['Red','Blue','Green','Yellow','Black','White','Orange','Purple']
        return [{'front': english[i], 'back': cols[i]} for i in range(min(len(english), len(cols)))]

    if 'phrase' in title_lower:
        y = data.get('yes', '');   n = data.get('no', '')
        s = data.get('sorry', ''); e = data.get('excuse', '')
        return [
            {'front': 'Yes',       'back': y} if y else None,
            {'front': 'No',        'back': n} if n else None,
            {'front': 'Sorry',     'back': s} if s else None,
            {'front': 'Excuse me', 'back': e} if e else None,
        ]

    if 'family' in title_lower:
        fam = data.get('family', {})
        pairs = [('Father', 'father'), ('Mother', 'mother'), ('Brother', 'brother'), ('Sister', 'sister')]
        return [{'front': eng, 'back': fam[key]} for eng, key in pairs if key in fam]

    if 'travel' in title_lower or 'direction' in title_lower:
        tr = data.get('travel', {})
        pairs = [('Airport', 'airport'), ('Hotel', 'hotel'), ('Ticket', 'ticket'), ('Map', 'map')]
        return [{'front': eng, 'back': tr[key]} for eng, key in pairs if key in tr]

    if 'food' in title_lower or 'drink' in title_lower:
        f = data.get('food', {})
        pairs = [('Bread', 'bread'), ('Milk', 'milk'), ('Water', 'water'), ('Apple', 'apple')]
        return [{'front': eng, 'back': f[key]} for eng, key in pairs if key in f]

    if 'time' in title_lower:
        t = data.get('time', {})
        pairs = [('Today', 'today'), ('Tomorrow', 'tomorrow'), ('Now', 'now'), ('Later', 'later')]
        return [{'front': eng, 'back': t[key]} for eng, key in pairs if key in t]

    return []


@api_router.get("/flashcards/{language}", response_model=List[FlashcardSet])
async def get_flashcards(language: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    lessons = SAMPLE_LESSONS.get(language, [])

    # Get user progress to check locking
    progress_docs = await db_conn.lesson_progress.find({
        'user_id': user['id'],
        'language': language
    }, {'_id': 0}).to_list(100)
    progress_map = {p['lesson_id']: p for p in progress_docs}

    result = []
    for lesson in sorted(lessons, key=lambda l: l['order']):
        raw_cards = _build_flashcards_for_lesson(lesson['title'], language)

        # Filter None, deduplicate by (front.lower(), back.lower())
        seen = set()
        cards = []
        for card in raw_cards:
            if not card:
                continue
            key = (card['front'].strip().lower(), card['back'].strip().lower())
            if key in seen or key[0] == key[1]:
                continue
            seen.add(key)
            cards.append({'front': card['front'].strip(), 'back': card['back'].strip()})

        if not cards:
            continue  # skip lessons with no valid flashcard data

        # Determine if locked
        locked = False
        if lesson['order'] > 1:
            prev_ids = {l['id'] for l in lessons if l.get('order') == lesson['order'] - 1}
            locked = not any(progress_map.get(pid, {}).get('completed', False) for pid in prev_ids)

        result.append(FlashcardSet(
            id=f"fs-{lesson['id']}",
            language=language,
            title=lesson['title'],
            order=lesson['order'],
            cards=cards,
            locked=locked
        ))

    return result

# ============ LEADERBOARD ROUTES ============

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(league: Optional[str] = None, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    
    query = {}
    if league:
        query['league'] = league
    
    users = await db_conn.users.find(query, {'_id': 0, 'password': 0}).sort('xp', -1).limit(50).to_list(50)
    
    result = []
    for i, u in enumerate(users):
        result.append(LeaderboardEntry(
            rank=i + 1,
            user_id=u['id'],
            name=u['name'],
            xp=u.get('xp', 0),
            level=u.get('level', 1),
            streak=u.get('streak', 0),
            league=u.get('league', 'Bronze')
        ))
    
    return result

# ============ ACHIEVEMENTS ROUTES ============

@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements(user: dict = Depends(get_current_user)):
    user_achievements = user.get('achievements', [])
    
    result = []
    for ach in ACHIEVEMENTS:
        unlocked = ach['id'] in user_achievements
        result.append(Achievement(
            id=ach['id'],
            name=ach['name'],
            description=ach['description'],
            icon=ach['icon'],
            unlocked=unlocked
        ))
    
    return result

async def check_and_award_achievement(user_id: str, achievement_id: str):
    db_conn = await require_db()
    user = await db_conn.users.find_one({'id': user_id}, {'_id': 0})
    if not user:
        return
    
    achievements = user.get('achievements', [])
    if achievement_id not in achievements:
        achievements.append(achievement_id)
        await db_conn.users.update_one({'id': user_id}, {'$set': {'achievements': achievements}})

async def check_lesson_achievements(user_id: str, streak: int, xp: int, level: int, perfect: bool):
    db_conn = await require_db()
    # First lesson
    progress_count = await db_conn.lesson_progress.count_documents({'user_id': user_id, 'completed': True})
    if progress_count == 1:
        await check_and_award_achievement(user_id, 'first-lesson')
    
    # Streak achievements
    if streak >= 3:
        await check_and_award_achievement(user_id, 'streak-3')
    if streak >= 7:
        await check_and_award_achievement(user_id, 'streak-7')
    if streak >= 30:
        await check_and_award_achievement(user_id, 'streak-30')
    if streak >= 100:
        await check_and_award_achievement(user_id, 'streak-100')
    
    # Lesson count achievements
    lessons_completed = await db_conn.lesson_progress.count_documents({'user_id': user_id, 'completed': True})
    if lessons_completed >= 1:
        await check_and_award_achievement(user_id, 'first-lesson')
    if lessons_completed >= 5:
        await check_and_award_achievement(user_id, 'lesson-5')
    if lessons_completed >= 20:
        await check_and_award_achievement(user_id, 'lesson-20')
    
    # XP achievements
    if xp >= 100:
        await check_and_award_achievement(user_id, 'xp-100')
    if xp >= 500:
        await check_and_award_achievement(user_id, 'xp-500')
    if xp >= 1000:
        await check_and_award_achievement(user_id, 'xp-1000')
    if xp >= 5000:
        await check_and_award_achievement(user_id, 'xp-5000')
    
    # Perfect lesson achievements
    if perfect:
        await check_and_award_achievement(user_id, 'perfect-lesson')
    
    perfect_count = await db_conn.lesson_progress.count_documents({'user_id': user_id, 'score': 100})
    if perfect_count >= 5:
        await check_and_award_achievement(user_id, 'perfect-5')

    # Multi-language achievements
    user_doc = await db_conn.users.find_one({'id': user_id})
    langs = user_doc.get('languages_learning', [])
    if len(langs) >= 3:
        await check_and_award_achievement(user_id, 'multi-language')
    if len(langs) >= 5:
        await check_and_award_achievement(user_id, 'lang-5')
    
    # Level achievements
    if level >= 5:
        await check_and_award_achievement(user_id, 'level-5')
    if level >= 10:
        await check_and_award_achievement(user_id, 'level-10')

# ============ PROFILE ROUTES ============

@api_router.put("/profile")
async def update_profile(name: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    await db_conn.users.update_one({'id': user['id']}, {'$set': {'name': name}})
    return {"message": "Profile updated"}

@api_router.post("/hearts/refill")
async def refill_hearts(user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    # In a real app, this would cost gems or require waiting
    await db_conn.users.update_one({'id': user['id']}, {'$set': {'hearts': 5}})
    return {"message": "Hearts refilled", "hearts": 5}

# ============ SOCIAL ROUTES ============

@api_router.get("/friends", response_model=List[LeaderboardEntry])
async def get_friends(user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    friend_ids = user.get('friends', [])
    if not friend_ids: return []
    
    friends = await db_conn.users.find({'id': {'$in': friend_ids}}, {'_id': 0, 'password': 0}).to_list(100)
    result = []
    for i, u in enumerate(friends):
        result.append(LeaderboardEntry(
            rank=i + 1,
            user_id=u['id'],
            name=u['name'],
            xp=u.get('xp', 0),
            level=u.get('level', 1),
            streak=u.get('streak', 0),
            league=u.get('league', 'Bronze')
        ))
    return result

@api_router.get("/friends/requests", response_model=List[FriendRequest])
async def get_friend_requests(user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    request_ids = user.get('friend_requests', [])
    if not request_ids: return []
    
    requesters = await db_conn.users.find({'id': {'$in': request_ids}}, {'_id': 0, 'password': 0}).to_list(100)
    return [FriendRequest(id=u['id'], name=u['name'], level=u.get('level', 1)) for u in requesters]

@api_router.post("/friends/request/{target_id}")
async def send_friend_request(target_id: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    if target_id == user['id']:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    
    target = await db_conn.users.find_one({'id': target_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db_conn.users.update_one({'id': target_id}, {'$addToSet': {'friend_requests': user['id']}})
    return {"message": "Friend request sent"}

@api_router.post("/friends/accept/{source_id}")
async def accept_friend_request(source_id: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    
    # Add to both friends lists
    await db_conn.users.update_one({'id': user['id']}, {
        '$addToSet': {'friends': source_id},
        '$pull': {'friend_requests': source_id}
    })
    await db_conn.users.update_one({'id': source_id}, {
        '$addToSet': {'friends': user['id']}
    })
    return {"message": "Friend request accepted"}

# ============ SHOP ROUTES ============

SHOP_ITEMS = [
    {"id": "streak-freeze", "name": "Streak Freeze", "description": "Protects your streak for one day of inactivity.", "cost": 200, "icon": "ice-cube"},
    {"id": "heart-refill", "name": "Heart Refill", "description": "Instantly refills your hearts to 5.", "cost": 100, "icon": "heart"},
    {"id": "xp-double", "name": "XP Double", "description": "Double XP for your next 3 lessons!", "cost": 150, "icon": "zap-double"},
]

GEM_PACKAGES = [
    {"id": "fistful-gems", "name": "Fistful of Gems", "amount": 250, "price": 39.0, "icon": "fist"},
    {"id": "pouch-gems", "name": "Pouch of Gems", "amount": 1000, "price": 119.0, "icon": "pouch"},
    {"id": "chest-gems", "name": "Chest of Gems", "amount": 5000, "price": 449.0, "icon": "chest"},
]

@api_router.get("/shop", response_model=List[ShopItem])
async def get_shop():
    return [ShopItem(**item) for item in SHOP_ITEMS]

@api_router.get("/shop/gems", response_model=List[GemPackage])
async def get_gem_packages():
    return [GemPackage(**gem) for gem in GEM_PACKAGES]

@api_router.post("/shop/buy/{item_id}")
async def buy_item(item_id: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    item = next((i for i in SHOP_ITEMS if i['id'] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if user.get('gems', 0) < item['cost']:
        raise HTTPException(status_code=400, detail="Not enough gems")
        
    # Deduction and inventory update
    if item_id == 'heart-refill':
        await db_conn.users.update_one({'id': user['id']}, {'$set': {'hearts': 5}, '$inc': {'gems': -item['cost']}})
    elif item_id == 'xp-double':
        await db_conn.users.update_one({'id': user['id']}, {
            '$push': {'active_boosters': {'id': 'xp-double', 'uses_left': 3}},
            '$inc': {'gems': -item['cost']}
        })
    else:
        await db_conn.users.update_one({'id': user['id']}, {
            '$push': {'inventory': item_id},
            '$inc': {'gems': -item['cost']}
        })
        
    return {"message": f"Bought {item['name']}", "gems": user.get('gems', 0) - item['cost']}

@api_router.post("/shop/gems/checkout/{package_id}")
async def buy_gem_package(package_id: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    package = next((p for p in GEM_PACKAGES if p['id'] == package_id), None)
    if not package:
        raise HTTPException(status_code=404, detail="Gem package not found")
        
    await db_conn.users.update_one({'id': user['id']}, {'$inc': {'gems': package['amount']}})
    return {"message": f"Successfully purchased {package['name']}!", "new_gems": (user.get('gems', 0) + package['amount'])}

@api_router.get("/users/search", response_model=List[LeaderboardEntry])
async def search_users(q: str, user: dict = Depends(get_current_user)):
    db_conn = await require_db()
    if len(q) < 2: return []
    
    # Search by name (case insensitive)
    matched = await db_conn.users.find({
        'name': {'$regex': q, '$options': 'i'},
        'id': {'$ne': user['id']}
    }, {'_id': 0, 'password': 0}).limit(10).to_list(10)
    
    result = []
    for i, u in enumerate(matched):
        result.append(LeaderboardEntry(
            rank=0,
            user_id=u['id'],
            name=u['name'],
            xp=u.get('xp', 0),
            level=u.get('level', 1),
            streak=u.get('streak', 0),
            league=u.get('league', 'Bronze')
        ))
    return result

# ============ ROOT ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Stratos API - Elevate Your Language Skills"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

if not FRONTEND_BUILD_DIR.exists():
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        """Redirect root to /api/ so visiting the server base URL shows the API."""
        return RedirectResponse(url="/api/")

from fastapi.responses import FileResponse

# Serve the frontend index.html for any unmatched routes (SPA routing)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_fallback(full_path: str):
    """Serve index.html for any unmatched routes (client-side routing)."""
    # 1. Skip API routes (they should have been handled by the router)
    if full_path.startswith('api/'):
        return JSONResponse(status_code=404, content={"detail": f"API route not found: {full_path}"})
    
    # 2. Check if the requested path exists as a physical file in the build directory
    # (This handles favicon.ico, manifest.json, etc. that aren't in /static)
    file_path = FRONTEND_BUILD_DIR / full_path
    if full_path and file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # 3. Fallback to index.html for React Router
    index_path = FRONTEND_BUILD_DIR / "index.html"
    if index_path.exists():
        # Read and inject API origin if needed, or just serve directly
        # Serving directly via FileResponse is more efficient
        return FileResponse(index_path)
    
    return HTMLResponse(content=f"Frontend build not found at {FRONTEND_BUILD_DIR}", status_code=404)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
