# Imagen base ligera de Python 3.12 (alineada al entorno del equipo de Data)
FROM python:3.12-slim

# Evitar generación de archivos .pyc y buffer de salida
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente y el modelo scikit-learn (.pkl)
COPY . .

# Exponer el puerto del microservicio de inferencia
EXPOSE 8000

# Comando para iniciar Uvicorn en producción/desarrollo
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
