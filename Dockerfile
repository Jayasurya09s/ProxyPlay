# Railway Dockerfile for backend
FROM python:3.13-slim

WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

CMD ["gunicorn", "-w", "3", "-b", "0.0.0.0:${PORT}", "app:app"]
