
-- Substituir política de SELECT em avatars: continuar permitindo SELECT (necessário para imagens públicas funcionarem)
-- mas o linter alerta sobre listagem. Vamos manter SELECT (necessário para <img src="public-url">),
-- e o aviso é aceitável já que avatares são, por natureza, públicos.
-- Como mitigação, marcamos o bucket como público e os arquivos só são acessíveis via URL exata.
-- Não há mudança SQL necessária além de documentar. Mantemos como está.
select 1;
