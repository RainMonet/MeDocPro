# app/routes/documents.py - Placeholder
from flask import Blueprint

documents_bp = Blueprint('documents', __name__)

@documents_bp.route('/test')
def test():
    return {"message": "Documents blueprint loaded"}
