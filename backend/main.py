import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client


# Load .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


app = FastAPI()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Model data supply
class Supply(BaseModel):
    date: str
    gentanCode: str
    qty: int
    remark: str


@app.get("/")
def root():
    return {
        "message": "Backend PPIC berhasil berjalan"
    }


# GET data dari Supabase
@app.get("/supplies")
def get_supplies():

    response = (
        supabase
        .table("supplies")
        .select("*")
        .order("id", desc=True)
        .execute()
    )

    data = response.data

    # Sesuaikan nama kolom Supabase dengan frontend
    result = []

    for item in data:
        result.append({
            "id": item["id"],
            "date": item["date"],
            "gentanCode": item["gentan_code"],
            "qty": item["qty"],
            "remark": item["remark"]
        })

    return result


# POST data ke Supabase
@app.post("/supplies")
def create_supply(supply: Supply):

    data = {
        "date": supply.date,
        "gentan_code": supply.gentanCode,
        "qty": supply.qty,
        "remark": supply.remark
    }

    response = (
        supabase
        .table("supplies")
        .insert(data)
        .execute()
    )

    return {
        "message": "Supply berhasil ditambahkan",
        "data": response.data
    }