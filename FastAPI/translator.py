import os
from dotenv import load_dotenv

load_dotenv()

class TextTranslator:
    """Traductor de texto configurable vía .env"""
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self._initialize_translator()
    
    def _initialize_translator(self):
        """Inicializa el traductor según la configuración en .env"""
        
        # Leer configuración
        provider = os.getenv("TRANSLATION_PROVIDER", "google").lower()
        
        if provider == "google":
            self._init_google()
        elif provider == "mock":
            self._init_mock()
        else:
            print(f"⚠️  Traductor '{provider}' no soportado. Usando modo mock.")
            self._init_mock()
    
    def _init_google(self):
        """Inicializa Google Cloud Translation"""
        try:
            from google.cloud import translate_v2 as translate
            
            api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            
            if api_key:
                self.client = translate.Client(api_key=api_key)
                self.enabled = True
                print("✅ Google Cloud Translation inicializado (API Key)")
            elif credentials_path and os.path.exists(credentials_path):
                self.client = translate.Client()
                self.enabled = True
                print("✅ Google Cloud Translation inicializado (Credentials file)")
            else:
                print("⚠️  No se encontraron credenciales de Google Cloud Translation")
                print("   Usando modo mock (sin traducción real)")
                self._init_mock()
                
        except ImportError:
            print("⚠️  google-cloud-translate no está instalado")
            print("   Instala con: pip install google-cloud-translate")
            self._init_mock()
        except Exception as e:
            print(f"⚠️  Error al inicializar Google Cloud Translation: {e}")
            self._init_mock()
    
    def _init_mock(self):
        """Modo mock: simula traducción (para desarrollo)"""
        self.enabled = False
        self.client = None
        print("📝 Modo mock: las traducciones serán simuladas")
    
    def translate(self, text: str, target_language: str = 'en') -> str:
        """
        Traduce texto al idioma objetivo.
        
        Args:
            text: Texto a traducir
            target_language: Código de idioma (ej: 'en', 'es')
        
        Returns:
            Texto traducido o el original si falla
        """
        if not text or not text.strip():
            return text
        
        # Si no está habilitado, devolver el original
        if not self.enabled or self.client is None:
            # En modo mock, simulamos traducción para español
            if self._is_spanish(text):
                print(f"🔄 [MOCK] Traduciendo: '{text[:50]}...'")
                # Simulación simple: texto en español → "Simulated translation"
                return f"[EN] {text}"
            return text
        
        try:
            result = self.client.translate(text, target_language=target_language)
            translated = result['translatedText']
            print(f"✅ Traducción exitosa: '{text[:30]}...' → '{translated[:30]}...'")
            return translated
        except Exception as e:
            print(f"⚠️  Error en traducción: {e}. Usando texto original.")
            return text
    
    def _is_spanish(self, text: str) -> bool:
        """Detección básica de español (para modo mock)"""
        spanish_indicators = ['qué', 'cómo', 'por qué', 'para', 'con', 'sin', 
                              'el', 'la', 'los', 'las', 'un', 'una']
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in spanish_indicators)