
Windows �ȉ��̑�����������Ă��������B
1. �R�}���h�v�����v�g��wsl --update�����s���Ă��������B
2. �ݒ�-�A�v���Ƌ@�\-�v���O�����Ƌ@�\-Windows�̋@�\�̗L�����܂��͖�����-Hyper-V�Ƀ`�F�b�N����OK���N���b�N�E�ċN�����Ă��������B
3. Docker Desktop���C���X�g�[�����N�����Ă��������B
4. �R�}���h�v�����v�g�Łudocker pull ubuntu:22.04�v�����s���邩
    Docker Desktop��ubuntu:22.04�̃C���[�W��������pull���Ă��������B
5. �ȉ��̃t�@�C���ƃf�B���N�g����{�f�B���N�g���ɏ������Ă��������B
	�EDockerfile
	�Edocker-compose.yaml
	�Emods_proxy_settings.txt
	�Estartup.sh
	�Ewebapps�f�B���N�g���i�z����geoserver.war�����݁j
6. �R�}���h�v�����v�g�ɂ�
	docker build -t badhbh:1.5 .
   �����s���Ă��������B�r���h�ɂ͎��Ԃ�������܂��B
7. �R�}���h�v�����v�g�ɂăe�i��
	docker compose up
   �����s���A�R���e�i�𗧂��グ�Ă��������B

http://localhost:8080
http://localhost:8080/plateau/
http://localhost:8080/geoserver/
�ȏ�̃y�[�W���J������Z�b�g�A�b�v��Ƃ͊����ł��Bgeoserver�̗����グ�ɂ͎��Ԃ�������܂��B
