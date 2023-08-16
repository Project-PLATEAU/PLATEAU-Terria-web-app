package view3d.lib;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import view3d.entity.ResponseError;

@RestControllerAdvice
public class ApiControllerAdvice extends ResponseEntityExceptionHandler {

	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, @Nullable Object body, HttpHeaders headers,
			HttpStatus status, WebRequest request) {
		ResponseError re = new ResponseError(status.value(), ex.getMessage());
		return super.handleExceptionInternal(ex, re, headers, status, request);
	}

	@ExceptionHandler(ResponseStatusException.class)
	protected ResponseEntity<Object> handleReponseStatus(ResponseStatusException ex, WebRequest request) {
		return handleExceptionInternal(ex, null, new HttpHeaders(), ex.getStatus(), request);

	}
	
	@ExceptionHandler(Exception.class)
	public ResponseEntity<Object> handleAll(Exception ex,WebRequest request){
		ResponseError re = new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "予期せぬ例外が起こりました");
		return new ResponseEntity<Object>(re,new HttpHeaders(),HttpStatus.INTERNAL_SERVER_ERROR);
	}

}
