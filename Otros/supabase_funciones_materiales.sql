-- ==========================================
-- SCRIPT: GENERACIÓN DE CÓDIGOS DE MATERIALES
-- ==========================================
-- Ejecuta este script en el SQL Editor de Supabase
-- ==========================================

-- 1. Función para previsualizar el código y obtener materiales del mismo grupo
CREATE OR REPLACE FUNCTION fn_preview_codigo_material(
    p_familia TEXT,
    p_subfamilia TEXT,
    p_descripcion TEXT
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    v_cod_familia TEXT;
    v_cod_subfamilia TEXT;
    v_cod_abcd TEXT;
    v_cod_descripcion TEXT;
    v_primera_letra TEXT;
    v_codigo_final TEXT;
    v_similares JSON;
BEGIN
    p_familia := TRIM(UPPER(p_familia));
    p_subfamilia := TRIM(UPPER(p_subfamilia));
    p_descripcion := TRIM(UPPER(p_descripcion));

    -- 1. cod_familia
    SELECT LPAD(cod_familia::text, 2, '0') INTO v_cod_familia
    FROM materiales
    WHERE UPPER(TRIM(familia)) = p_familia AND cod_familia IS NOT NULL
    LIMIT 1;

    IF v_cod_familia IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_familia::int), 0) + 1)::text, 2, '0') INTO v_cod_familia
        FROM materiales
        WHERE cod_familia ~ '^[0-9]+$';
    END IF;

    -- 2. cod_subfamilia
    SELECT LPAD(cod_subfamilia::text, 2, '0') INTO v_cod_subfamilia
    FROM materiales
    WHERE UPPER(TRIM(familia)) = p_familia 
      AND UPPER(TRIM(subfamilia)) = p_subfamilia 
      AND cod_subfamilia IS NOT NULL
    LIMIT 1;

    IF v_cod_subfamilia IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_subfamilia::int), 0) + 1)::text, 2, '0') INTO v_cod_subfamilia
        FROM materiales
        WHERE cod_familia = v_cod_familia
          AND cod_subfamilia ~ '^[0-9]+$';
    END IF;

    -- 3. cod_abcd
    v_primera_letra := SUBSTRING(p_descripcion FROM 1 FOR 1);
    
    SELECT LPAD(cod_abcd::text, 2, '0') INTO v_cod_abcd
    FROM materiales
    WHERE cod_familia = v_cod_familia 
      AND cod_subfamilia = v_cod_subfamilia
      AND UPPER(SUBSTRING(TRIM(descripcion) FROM 1 FOR 1)) = v_primera_letra
      AND cod_abcd IS NOT NULL
    LIMIT 1;

    IF v_cod_abcd IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_abcd::int), 0) + 1)::text, 2, '0') INTO v_cod_abcd
        FROM materiales
        WHERE cod_familia = v_cod_familia 
          AND cod_subfamilia = v_cod_subfamilia
          AND cod_abcd ~ '^[0-9]+$';
    END IF;

    -- 4. cod_descripcion
    SELECT LPAD((COALESCE(MAX(cod_descripcion::int), 0) + 1)::text, 4, '0') INTO v_cod_descripcion
    FROM materiales
    WHERE cod_familia = v_cod_familia 
      AND cod_subfamilia = v_cod_subfamilia 
      AND cod_abcd = v_cod_abcd
      AND cod_descripcion ~ '^[0-9]+$';

    -- Concatenar código final
    v_codigo_final := v_cod_familia || v_cod_subfamilia || v_cod_abcd || v_cod_descripcion;

    -- Buscar similares
    SELECT COALESCE(json_agg(
        json_build_object(
            'cod2', cod2,
            'descripcion', descripcion,
            'unidad_medida', unidad_medida
        )
    ), '[]'::json) INTO v_similares
    FROM (
        SELECT cod2, descripcion, unidad_medida 
        FROM materiales
        WHERE cod_familia = v_cod_familia 
          AND cod_subfamilia = v_cod_subfamilia 
          AND cod_abcd = v_cod_abcd
        ORDER BY codigo DESC
        LIMIT 20
    ) sub;

    RETURN json_build_object(
        'codigo', v_codigo_final,
        'cod_familia', v_cod_familia,
        'cod_subfamilia', v_cod_subfamilia,
        'cod_abcd', v_cod_abcd,
        'cod_descripcion', v_cod_descripcion,
        'similares', v_similares
    );
END;
$$;

-- 2. Función para crear el material de forma segura
CREATE OR REPLACE FUNCTION fn_crear_material(
    p_familia TEXT,
    p_subfamilia TEXT,
    p_descripcion TEXT,
    p_unidad_medida TEXT,
    p_numero_parte TEXT,
    p_modelo TEXT,
    p_activo TEXT,
    p_creado_por TEXT
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    v_cod_familia TEXT;
    v_cod_subfamilia TEXT;
    v_cod_abcd TEXT;
    v_cod_descripcion TEXT;
    v_primera_letra TEXT;
    v_codigo_final TEXT;
    v_existe BOOLEAN;
BEGIN
    p_familia := TRIM(UPPER(p_familia));
    p_subfamilia := TRIM(UPPER(p_subfamilia));
    p_descripcion := TRIM(UPPER(p_descripcion));
    p_unidad_medida := TRIM(UPPER(p_unidad_medida));
    
    -- Validar si la descripción exacta ya existe en esa familia/subfamilia
    SELECT EXISTS (
        SELECT 1 FROM materiales 
        WHERE UPPER(TRIM(familia)) = p_familia 
          AND UPPER(TRIM(subfamilia)) = p_subfamilia 
          AND UPPER(TRIM(descripcion)) = p_descripcion
    ) INTO v_existe;

    IF v_existe THEN
        RAISE EXCEPTION 'El material con esta descripción ya existe en la familia y subfamilia indicadas.';
    END IF;

    -- Generar código repitiendo la lógica de preview pero asegurando bloqueo transaccional
    -- 1. cod_familia
    SELECT LPAD(cod_familia::text, 2, '0') INTO v_cod_familia
    FROM materiales
    WHERE UPPER(TRIM(familia)) = p_familia AND cod_familia IS NOT NULL
    LIMIT 1;

    IF v_cod_familia IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_familia::int), 0) + 1)::text, 2, '0') INTO v_cod_familia
        FROM materiales WHERE cod_familia ~ '^[0-9]+$';
    END IF;

    -- 2. cod_subfamilia
    SELECT LPAD(cod_subfamilia::text, 2, '0') INTO v_cod_subfamilia
    FROM materiales
    WHERE UPPER(TRIM(familia)) = p_familia 
      AND UPPER(TRIM(subfamilia)) = p_subfamilia AND cod_subfamilia IS NOT NULL
    LIMIT 1;

    IF v_cod_subfamilia IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_subfamilia::int), 0) + 1)::text, 2, '0') INTO v_cod_subfamilia
        FROM materiales WHERE cod_familia = v_cod_familia AND cod_subfamilia ~ '^[0-9]+$';
    END IF;

    -- 3. cod_abcd
    v_primera_letra := SUBSTRING(p_descripcion FROM 1 FOR 1);
    SELECT LPAD(cod_abcd::text, 2, '0') INTO v_cod_abcd
    FROM materiales
    WHERE cod_familia = v_cod_familia 
      AND cod_subfamilia = v_cod_subfamilia
      AND UPPER(SUBSTRING(TRIM(descripcion) FROM 1 FOR 1)) = v_primera_letra
      AND cod_abcd IS NOT NULL
    LIMIT 1;

    IF v_cod_abcd IS NULL THEN
        SELECT LPAD((COALESCE(MAX(cod_abcd::int), 0) + 1)::text, 2, '0') INTO v_cod_abcd
        FROM materiales 
        WHERE cod_familia = v_cod_familia AND cod_subfamilia = v_cod_subfamilia AND cod_abcd ~ '^[0-9]+$';
    END IF;

    -- Bucle para garantizar unicidad en caso de colisiones extremas
    LOOP
        -- 4. cod_descripcion
        SELECT LPAD((COALESCE(MAX(cod_descripcion::int), 0) + 1)::text, 4, '0') INTO v_cod_descripcion
        FROM materiales
        WHERE cod_familia = v_cod_familia 
          AND cod_subfamilia = v_cod_subfamilia 
          AND cod_abcd = v_cod_abcd
          AND cod_descripcion ~ '^[0-9]+$';

        v_codigo_final := v_cod_familia || v_cod_subfamilia || v_cod_abcd || v_cod_descripcion;

        -- Verificar si existe el codigo final
        SELECT EXISTS(SELECT 1 FROM materiales WHERE codigo = v_codigo_final) INTO v_existe;
        EXIT WHEN NOT v_existe;
        -- Si existe (raro si estamos en transacción, pero por seguridad), el ciclo vuelve a intentar
    END LOOP;

    -- INSERTAR EN LA BASE DE DATOS
    INSERT INTO materiales (
        codigo, 
        cod2, 
        descripcion, 
        unidad_medida, 
        familia, 
        cod_familia, 
        subfamilia, 
        cod_subfamilia, 
        cod_abcd, 
        cod_descripcion, 
        numero_parte, 
        marca_equipo, 
        activo, 
        largo_codigo,
        creado_por,
        modificado_por
    ) VALUES (
        v_codigo_final,
        v_codigo_final, -- cod2 es igual por defecto
        p_descripcion,
        p_unidad_medida,
        p_familia,
        v_cod_familia,
        p_subfamilia,
        v_cod_subfamilia,
        v_cod_abcd,
        v_cod_descripcion,
        p_numero_parte,
        p_modelo,
        COALESCE(p_activo, 'SI'),
        LENGTH(v_codigo_final)::text,
        p_creado_por,
        p_creado_por
    );

    RETURN json_build_object(
        'success', true,
        'codigo', v_codigo_final
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
