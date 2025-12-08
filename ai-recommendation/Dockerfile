FROM python:3.11-slim-buster

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data
COPY scripts ./scripts

# Run data setup scripts
# RUN python scripts/index_all_datasets.py
# RUN python scripts/populate_booking_db_from_csv.py
# RUN python scripts/populate_all_deals.py
# RUN python scripts/check_data_import_status.py

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
