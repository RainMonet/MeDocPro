# Test streaming endpoint

@document_generation_bp.route('/generate-documents-stream-test', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def generate_batch_documents_stream_test():
    """Simple test version of streaming generation"""
    from flask import Response
    import json
    
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = Response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response
    
    try:
        from flask import current_app
        
        # Get authenticated user
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        patients = data.get('patients', [])
        
        def generate_test_stream():
            with current_app.app_context():
                try:
                    # Send initial progress
                    yield f"data: {json.dumps({'type': 'progress', 'current': 0, 'total': len(patients), 'status': 'Starting test...'})}\\n\\n"
                    
                    # Test debug message
                    yield f"data: {json.dumps({'type': 'debug', 'message': f'Test generator with {len(patients)} patients'})}\\n\\n"
                    
                    # Simple completion
                    yield f"data: {json.dumps({'type': 'complete', 'success': True, 'message': 'Test completed', 'documents': [], 'batch_id': 'test_123', 'total_count': len(patients), 'successful_count': 0, 'failed_count': 0, 'failed_patients': []})}\\n\\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Test error: {str(e)}'})}\\n\\n"
        
        return Response(
            generate_test_stream(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': 'http://localhost:5173',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
                'Access-Control-Allow-Credentials': 'true'
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"Error in test streaming: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500