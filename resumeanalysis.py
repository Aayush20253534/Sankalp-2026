import os
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# 1. Initialize the model
model = init_chat_model(
    model="gemini-2.5-flash-lite", 
    model_provider="google_genai",
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0,
    max_tokens=1024
)

class MarketReadiness(BaseModel):
    key_strengths: List[str] = Field(description="Top professional strengths found in the resume relative to the target")
    critical_gaps: List[str] = Field(description="Major missing experiences or qualifications")
    missing_keywords: List[str] = Field(description="Specific technical or industry terms missing from the resume")
    ai_suggestion: str = Field(description="A concise strategic advice (max 50 words)")

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You are an expert Career Strategist. Compare the provided Resume Text against the Target Role. "
        "Provide a detailed analysis of market readiness."
    )),
    ("user", "Target Role: {target}\n\nResume Text: {resume_text}")
])

structured_model = model.with_structured_output(MarketReadiness)

chain = prompt | structured_model

def analyze_resume(resume_text: str, target_role: str):
    """
    Analyzes resume text against a target role and returns structured feedback.
    """
    response = chain.invoke({
        "resume_text": resume_text,
        "target": target_role
    })
    return response

# --- Example Usage ---
if __name__ == "__main__":
    # Example inputs (Replace these with your OCR output)
    my_resume = "Experienced Python developer with 5 years in Django and Flask. Proficient in SQL and AWS."
    my_target = "Senior Machine Learning Engineer at a FinTech startup"

    result = analyze_resume(my_resume, my_target)
    result = result.model_dump()
    print("### MARKET READINESS REPORT ###")
    print(f"Key Strengths: {', '.join(result['key_strengths'])}")
    print(f"Critical Gaps: {', '.join(result['critical_gaps'])}")
    print(f"Missing Keywords: {', '.join(result['missing_keywords'])}")
    print(f"AI Suggestion: {result['ai_suggestion']}")