import os
from typing import List, Union
from fastapi import FastAPI, HTTPException, Depends, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from dotenv import load_dotenv
from pydantic import BaseModel


from auth import authenticate_admin, create_token
from vector_store import add_faq, retrieve_context, delete_faq, get_all_faqs
from rag_engine import generate_answer

load_dotenv()

secret_key = os.getenv("SECRET_KEY")
algorithm = "HS256"

app = FastAPI(title = "StreamKar Chatbot")

class LoginRequest(BaseModel):
    username: str
    password: str

class FAQRequest(BaseModel):
    question: str
    answer: str

class AskRequest(BaseModel):
    question: str

class DeleteFAQRequest(BaseModel):
    question: str


security = HTTPBearer()

app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def root():
    return FileResponse("index.html")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])

        return payload["sub"]

    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/login")
def login(request: LoginRequest):

    if not authenticate_admin(request.username, request.password):
        raise HTTPException(401, "Invalid admin credentials")

    token = create_token(request.username)

    return {"access_token": token,
            "message": "Login successful"}


@app.post("/add_faq")
def add_faq_api(
    request: Union[FAQRequest, List[FAQRequest]],
    user = Depends(verify_token)
):
    if isinstance(request, list):
        for item in request:
            add_faq(item.question, item.answer)
        return {"message": f"{len(request)} faqs added successfully"}
    else:
        add_faq(request.question, request.answer)
        return {"message": "faq added successfully"}


@app.post("/delete_faq")
def delete_faq_api(
    request: DeleteFAQRequest,
    user = Depends(verify_token)
):
    delete_faq(request.question)

    return {"message": "faq deleted successfully"}


@app.get("/list_faqs")
def list_faqs_api(user = Depends(verify_token)):
    return {"faqs": get_all_faqs()}


@app.get("/style.css")
def get_css():
    return FileResponse("style.css")

@app.get("/script.js")
def get_js():
    return FileResponse("script.js")
@app.post("/ask")
def ask_bot(request: AskRequest):
    context = retrieve_context(request.question)
    answer = generate_answer(context, request.question)

    return{"question":request.question,
            "answer":answer}