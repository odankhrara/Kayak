FROM python:3.11-slim-buster

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install MySQL client so seed-service can run mysql commands
RUN apt-get update && apt-get install -y default-mysql-client && apt-get clean

COPY app ./app
COPY data ./data
COPY scripts ./scripts

CMD ["bash"]
