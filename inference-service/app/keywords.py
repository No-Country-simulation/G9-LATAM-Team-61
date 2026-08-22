import re
import unicodedata
from collections import Counter
from app.config import KEYWORDS_TOP_N

STOPWORDS_ES = {
    # Artículos, preposiciones y conjunciones
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'de', 'del', 'a', 'al',
    'ante', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'segun',
    'sin', 'sobre', 'tras', 'durante', 'mediante', 'que', 'como', 'este', 'esta', 'estos', 'estas',
    'esto', 'ese', 'esa', 'esos', 'esas', 'eso', 'aquel', 'aquella', 'aquellos', 'aquellas', 'aquello',
    
    # Pronombres y posesivos
    'yo', 'tu', 'el', 'ella', 'ello', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas',
    'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'mio', 'mia', 'mios', 'mias', 'tuyo', 'tuya', 'tuyos',
    'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro',
    'vuestra', 'vuestros', 'vuestras', 'alguien', 'nadie', 'algo', 'nada', 'alguno', 'alguna',
    'algunos', 'algunas', 'ninguno', 'ninguna', 'ningunos', 'ningunas', 'todo', 'toda', 'todos',
    'todas', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas', 'cual', 'cuales',
    'quien', 'quienes', 'donde', 'cuando', 'porque',
    
    # Verbos copulativos y auxiliares
    'es', 'son', 'fue', 'fueron', 'era', 'eran', 'ser', 'siendo', 'sido', 'estar', 'estoy', 'estas',
    'esta', 'estamos', 'estan', 'estaba', 'estaban', 'estando', 'estado', 'haber', 'hay', 'habia',
    'habian', 'he', 'has', 'ha', 'hemos', 'han', 'hubo', 'habiendo', 'habido',
    
    # Verbos de necesidad, deseo y solicitud (Muletillas funcionales)
    'necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitan', 'necesitar', 'necesitando', 'necesitado',
    'requiero', 'requieres', 'requiere', 'requerimos', 'requieren', 'requerir', 'requiriendo', 'requerido',
    'quiero', 'quieres', 'quiere', 'queremos', 'quieren', 'querer', 'queriendo', 'querido',
    'busco', 'buscas', 'busca', 'buscamos', 'buscan', 'buscar', 'buscando', 'buscado',
    'deseo', 'deseas', 'desea', 'deseamos', 'desean', 'desear',
    'ayuda', 'ayudas', 'ayudar', 'ayudando', 'ayudame', 'ayudarme', 'ayudarnos', 'ayudenme',
    
    # Verbos de deber y poder (Modales)
    'debo', 'debes', 'debe', 'debemos', 'deben', 'deber', 'debiendo', 'debido', 'deberia', 'deberias',
    'deberian', 'deberiamos', 'puedo', 'puedes', 'puede', 'podemos', 'pueden', 'poder', 'pudiendo',
    'podido', 'podria', 'podrias', 'podrian', 'podriamos',
    
    # Verbos de acción técnica general / conversacionales
    'tengo', 'tienes', 'tiene', 'tenemos', 'tienen', 'tener', 'teniendo', 'tenido', 'tenia', 'tenian',
    'hago', 'haces', 'hace', 'hacemos', 'hacen', 'hacer', 'haciendo', 'hecho',
    'digo', 'dices', 'dice', 'decimos', 'dicen', 'decir', 'diciendo', 'dicho',
    'voy', 'vas', 'va', 'vamos', 'van', 'ir', 'yendo', 'ido',
    'veo', 'ves', 've', 'vemos', 'ven', 'ver', 'viendo', 'visto',
    'doy', 'das', 'da', 'damos', 'dan', 'dar', 'dando', 'dado',
    'se', 'sabes', 'sabe', 'sabemos', 'saben', 'saber', 'sabiendo', 'sabido',
    'conozco', 'conoces', 'conoce', 'conocemos', 'conocen', 'conocer',
    'pongo', 'pones', 'pone', 'ponemos', 'ponen', 'poner', 'poniendo', 'puesto',
    'parece', 'parecen', 'parecer', 'pareciendo',
    'llego', 'llegas', 'llega', 'llegamos', 'llegan', 'llegar', 'llegando', 'llegado',
    'paso', 'pasas', 'pasa', 'pasamos', 'pasan', 'pasar', 'pasando', 'pasado',
    'intento', 'intentas', 'intenta', 'intentamos', 'intentan', 'intentar', 'intentando', 'intentado',
    'trato', 'tratas', 'trata', 'tratamos', 'tratan', 'tratar', 'tratando', 'tratado',
    'pruebo', 'pruebas', 'prueba', 'probamos', 'prueban', 'probar', 'probando', 'probado',
    'soluciono', 'soluciona', 'solucionar', 'solucionando', 'resuelvo', 'resuelve', 'resolver',
    'experiencia', 'experiencias',
    
    # Saludos, cortesía y muletillas
    'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'saludos', 'gracias', 'muchas',
    'favor', 'estimado', 'estimados', 'equipo', 'compañeros', 'gente', 'chicos', 'amigos',
    'ademas', 'tambien', 'adicionalmente', 'actualmente', 'respecto', 'acerca',
    
    # Términos de contexto genérico / no discriminatorios
    'problema', 'problemas', 'error', 'errores', 'fallo', 'fallos', 'duda', 'dudas', 'consulta',
    'consultas', 'pregunta', 'preguntas', 'tema', 'temas', 'caso', 'casos', 'cosa', 'cosas',
    'ejemplo', 'ejemplos', 'guia', 'guias', 'tutorial', 'tutoriales', 'paso', 'pasos', 'tipo',
    'tipos', 'modo', 'modos', 'forma', 'formas', 'manera', 'maneras', 'uso', 'usos', 'pro',
    'configuracion', 'configurar', 'configurando', 'configurado', 'configuro',
    'instalacion', 'instalar', 'instalando', 'instalado', 'instalo',
    'proyecto', 'proyectos', 'servidor', 'web', 'sistema', 'sistemas', 'aplicacion', 'aplicaciones', 'codigo'
}

STOPWORDS_EN = {
    'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at',
    'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
    'now', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its',
    'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
    'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'do', 'does', 'did', 'doing', 'would', 'could', 'should', 'ought', 'also', 'many', 'find',
    'finds', 'seems', 'moment', 'please', 'anyone', 'someone', 'everybody', 'guys', 'team',
    'example', 'examples', 'usage', 'around', 'world', 'wide', 'need', 'needs', 'needing', 'needed',
    'want', 'wants', 'wanting', 'wanted', 'require', 'requires', 'requiring', 'required',
    'help', 'helps', 'helping', 'helped', 'thanks', 'thank', 'hello', 'hi', 'hey',
    'problem', 'problems', 'issue', 'issues', 'error', 'errors', 'failure', 'failures', 'bug', 'bugs',
    'try', 'trying', 'tried', 'start', 'starting', 'started', 'run', 'running', 'experience', 'let'
}

STOPWORDS_COMMON = STOPWORDS_ES | STOPWORDS_EN

def extract_keywords(text: str, top_n: int = KEYWORDS_TOP_N) -> list[str]:
    """
    Extrae las palabras clave (keywords) más relevantes preservando términos técnicos
    y eliminando stopwords, números de versión y caracteres ruidosos.
    """
    if not text:
        return []

    # Preservar acentos y convertir a minúsculas
    nfkd_form = unicodedata.normalize('NFKD', text.lower())
    text_no_accents = "".join([c for c in nfkd_form if not unicodedata.combining(c)])

    # Permitir letras, números, arrobas (@) y guiones para capturar @HostBinding o angular-services
    clean_text = re.sub(r"[^a-zA-Z0-9\s@\.\-]", " ", text_no_accents)
    tokens = clean_text.split()

    filtered_tokens = []
    for token in tokens:
        t = token.strip(".-")
        # Filtrar stopwords, palabras de menos de 3 letras, y números puros o versiones (como 22.04 u 8.1)
        if not t or t in STOPWORDS_COMMON or len(t) < 3 or t.isdigit() or t.replace(".", "").isdigit():
            continue
        filtered_tokens.append(t)

    counts = Counter(filtered_tokens)
    return [word for word, _ in counts.most_common(top_n)]
