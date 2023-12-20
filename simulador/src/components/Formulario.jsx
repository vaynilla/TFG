import { useForm } from "react-hook-form";
import {createElement} from "react";

const Formulario = () => {

    const { register, formState: { errors }, watch, handleSubmit, reset } = useForm();

    const num_habitaciones = watch('num_habitaciones', 0); // Para saber en cada momento el valor del número de habitaciones y poder así modificar el cuestionario
    const MAX_HABITACIONES = 20;
    const CALOR_HUMANO = 0.018;

    const prueba = () => {
        alert("Enviado");
    }

    // Función que se ejecutará cuando se envíe el formulario
    const onSubmit = async (data) => {
        // COMPROBAR QUE LAS CANTIDADES DE PERSONAS SEAN POSITIVAS
        prueba();
        // data.exterior.toUpperCase()
        // Aquí podemos cambiar los datos y modificarlos antes de enviarlos para que entren con el formato que queramos en la API,
        // también podemos cambiarlos antes, en el formulario, con la función setValue de react-hook-form
        // Con fetch se podrán enviar datos a nuestra API
        console.log(data)

        // Creamos el edificio a partir de los datos del formulario para enviarlo posteriormente a la API
        const edificio = {
            ecuaciones: [],
            condiciones_iniciales: {}
        };

        // Para cada habitación, añadimos en las condiciones iniciales un atributo y_i con la temperatura inicial de esa habitación
        for (let i = 0; i < num_habitaciones; i++){
            edificio.condiciones_iniciales[`y_${i}`] = data[`y_${i}`];
        }

        // Para cada habitación del edificio creamos su ecuación y la añadimos al sistema de ecuaciones
        for (let i = 0; i < num_habitaciones; i++){
            // Comprobar tanto la cantidad de personas en la habitación como los aires acondicionados para luego meterlos en la ecuación
            let habitaciones_contiguas = data[`contiguas_${i}`].split(',');
            let ecuacion = "";
            for (let j = 0; j < habitaciones_contiguas.length; j++){
                ecuacion = ecuacion + `(y[${habitaciones_contiguas[j]}] - y[${i}])/${data.constante_habitaciones}+`;
            }
            // Ahora añadimos la parte con el exterior
            ecuacion = ecuacion + `(${data.exterior}-y[${i}])/${data.constante_exterior}`;
            // Comprobamos si tiene aire acondicionado
            if (data[`aire_${i}`]) {
                ecuacion = ecuacion + ` + (${data.fuerza_aire})`;
            }
            // Introducimos en la ecuación según la cantidad de personas
            ecuacion = ecuacion + ` + ${data[`personas_${i}`]}` + `*${CALOR_HUMANO}`;
            edificio.ecuaciones.push(ecuacion);
        }

        console.log(edificio);

        try {
            let config = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(edificio),
            }
            let response = await fetch('http://localhost:5000/resolver_ecuaciones', config)
            let json = await response.json()

            // Mostramos la respuesta de la API
            console.log(json)
        } catch (error) {

        }

    }

    // Función que nos permite modificar el formulario según el número de habitaciones y aumentar la cantidad de campos
    const addCampos = (msg, registro, n, type) => {
        let form = []
        for(let i=0; i<n; i++){
            form.push(createElement(
                'div',
                {key: i},
                <label>{msg + i + ": "}</label>,
                <input type={type} {...register(registro+i)} />
            ))
        }
        return createElement('div', null, form)
    }

    // Se pueden hacer las validaciones antes y que el código quede más limpio

    return <div>
        <h2>Generación del edificio</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label>Temperatura exterior: </label>
                <input type="text" {...register('exterior', {   // Registramos el campo exterior en el formulario
                    required: true  // Para que el campo sea rellenado obligatoriamente ddfs
                })} />
                {errors.exterior?.type === 'required' && <p>El campo temperatura exterior es obligatorio</p>}
            </div>
            <div>
                <label>Número de habitaciones: </label>
                <input type={'number'} {...register('num_habitaciones', {
                    required: true,
                    validate: (value) => value <= MAX_HABITACIONES
                })}/>
                {errors.num_habitaciones?.type === 'required' && <p>El campo número de habitaciones es obligatorio</p>}
                {errors.num_habitaciones?.type === 'validate'}
                {num_habitaciones > MAX_HABITACIONES && <p>El edificio no puede tener más de {MAX_HABITACIONES} habitaciones</p>}
            </div>
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Temperatura inicial de la habitación ","y_",num_habitaciones, "number")}
            {/*Mostramos el nivel de aislamiento entre habitaciones siempre que haya más de 1 habitación, de lo contrario no tendría sentido*/}
            {num_habitaciones > 1 &&
                <div>
                    <label>Constante de transferencia entre habitaciones (A mayor número, menor aislamiento): </label>
                    {/*Permitimos hasta 2 números decimales en la constante de aislamiento*/}
                    <input type="number" step=".01" {...register('constante_habitaciones', {
                        required: true,
                        validate: (value) => value > 0
                    })} />
                    {errors.constante_habitaciones?.type === 'required' && <p>El campo constante de transferencia entre habitaciones es obligatorio</p>}
                    {errors.constante_habitaciones?.type === 'validate' && <p>Debe ser un número positivo</p>}
                </div>
            }
            <div>
                <label>Constante de transferencia del edificio con el exterior: </label>
                {/*Permitimos hasta 2 números decimales en la constante de aislamiento*/}
                <input type="number" step=".01" {...register('constante_exterior', {
                    required: true,
                    validate: (value) => value > 0
                })} />
                {errors.constante_exterior?.type === 'required' && <p>El campo constante de transferencia con el exterior es obligatorio</p>}
                {errors.constante_exterior?.type === 'validate' && <p>Debe ser un número positivo</p>}
            </div>
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Cantidad de personas en la habitación ","personas_",num_habitaciones, "number")}
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Tiene aire acondicionado la habitación  ","aire_",num_habitaciones, "checkbox")}
            {/*Maybe tengo que sacar este campo sólo si se ha marcado algún aire pero no se cómo hacerlo*/}
            <div>
                <label>Fuerza del aire acondicionado (ºC/h): </label>
                <input type='number' step={".001"} {...register('fuerza_aire')}/>
            </div>
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Habitaciones contiguas a la habitacion  ","contiguas_",num_habitaciones, "text")}
            <input className="btn btn-primary" type="submit" value="Enviar" />
        </form>
    </div>
}

export default Formulario;