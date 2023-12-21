import {useForm} from "react-hook-form";
import {createElement, useState} from "react";
import {Layout} from "antd";
import {Content} from "antd/es/layout/layout";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const Simulador = () => {
    const { register, formState: { errors }, watch, handleSubmit, reset } = useForm();

    const [datos, setDatos] = useState([]);

    const num_habitaciones = watch('num_habitaciones'); // Para saber en cada momento el valor del número de habitaciones y poder así modificar el cuestionario
    const MAX_HABITACIONES = 20;
    const CALOR_HUMANO = 0.018;

    // Función que se ejecutará cuando se envíe el formulario
    const onSubmit = async (data) => {
        // reset();

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

        // Enviamos la información a la API
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
            let data = await response.json()

            // Añadimos al state los datos para poder utilizarlos luego en Highcharts
            setDatos(data)
            console.log(datos)
        } catch (error) {

        }

    }

    // Función que nos permite modificar el formulario según el número de habitaciones y aumentar la cantidad de campos
    const addCampos = (msg, registro, n, type) => {
        let form = []
        if (type !== "checkbox") {
            for (let i = 0; i < n; i++) {
                form.push(createElement(
                    'div',
                    {key: i, className:"form-floating mb-1"},
                    <input type={type} className="form-control" placeholder="ejemplo" {...register(registro + i)} required/>,
                    <label htmlFor="floatingInput">{msg + i + ": "}</label>
                ))
            }
        }
        else { // El checkbox no lo hacemos requerido
            for (let i = 0; i < n; i++) {
                form.push(createElement(
                    'div',
                    {key: i, className:"form-check"},
                    <input type={type} className="form-check-input" {...register(registro + i)}/>,
                    <label className="form-check-label" form="defaultCheck1"> {msg + i} </label>
                ))
            }
        }
        return createElement('div', null, form)
    }

    const convertir_datos = () => {
        // Para cuando todavía no hemos enviado el formulario
        if (!datos || !datos.t || !Array.isArray(datos.y))
            return []
        else
            return datos.y.map((habitacion, index) => ({
                name: `Habitación ${index}`,
                data: habitacion.map((temperatura, tIndex) => [datos.t[tIndex], temperatura]),
            }))
    }

    const options = {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Temperatura del edificio'
        },
        yAxis: {
            title: {
                text: 'Temperatura (°C)'
            }
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: false
                },
                enableMouseTracking: true
            }
        },
        series: convertir_datos()
    }

    return <Layout hasSider><Content><div className={"container col-10 p-5"}>
        <div align="center"><h2>Generación del edificio</h2></div>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-floating mb-2">
                <input type="text" className="form-control" placeholder="ejemplo" {...register('exterior', {   // Registramos el campo exterior en el formulario
                    required: true  // Para que el campo sea rellenado obligatoriamente
                })} required/>
                <label htmlFor="floatingInput">Temperatura exterior</label>
            </div>
            <div className="form-floating mb-2">
                <input type={'number'} className="form-control" placeholder="ejemplo" {...register('num_habitaciones', {
                    required: true,
                    validate: (value) => value <= MAX_HABITACIONES
                })} required/>
                <label htmlFor="floatingInput">Número de habitaciones: </label>
                {errors.num_habitaciones?.type === 'validate'}
                {num_habitaciones > MAX_HABITACIONES && <p>El edificio no puede tener más de {MAX_HABITACIONES} habitaciones</p>}
            </div>
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Temperatura inicial de la habitación ","y_",num_habitaciones, "number")}
            {/*Mostramos el nivel de aislamiento entre habitaciones siempre que haya más de 1 habitación, de lo contrario no tendría sentido*/}
            {num_habitaciones > 1 &&
                <div className="form-floating mb-2">
                    {/*Permitimos hasta 2 números decimales en la constante de aislamiento*/}
                    <input type="number" step=".01" className="form-control" placeholder="ejemplo" {...register('constante_habitaciones', {
                        required: true,
                        validate: (value) => value > 0
                    })} required/>
                    <label htmlFor="floatingInput">Constante de transferencia entre habitaciones (A mayor número, menor aislamiento): </label>
                    {errors.constante_habitaciones?.type === 'validate' && <p>Debe ser un número positivo</p>}
                </div>
            }
            <div className="form-floating mb-2">
                {/*Permitimos hasta 2 números decimales en la constante de aislamiento*/}
                <input type="number" step=".01" className="form-control" placeholder="ejemplo" {...register('constante_exterior', {
                    required: true,
                    validate: (value) => value > 0
                })} required/>
                <label  htmlFor="floatingInput">Constante de transferencia del edificio con el exterior: </label>
                {errors.constante_exterior?.type === 'validate' && <p>Debe ser un número positivo</p>}
            </div>
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Cantidad de personas en la habitación ","personas_",num_habitaciones, "number")}
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Aire acondicionado en la habitación  ","aire_",num_habitaciones, "checkbox")}
            {/*Maybe tengo que sacar este campo sólo si se ha marcado algún aire pero no se cómo hacerlo*/}
            <div className="form-floating mb-2">
                <input type='number' step={".001"} className="form-control" placeholder="ejemplo" {...register('fuerza_aire')} required/>
                <label htmlFor="floatingInput">Fuerza del aire acondicionado (ºC/h): </label>
            </div>
            {/*No controlamos que el usuario meta en el formato correcto las habitaciones contiguas*/}
            {num_habitaciones <= MAX_HABITACIONES && addCampos("Habitaciones contiguas a la habitacion  ","contiguas_",num_habitaciones, "text")}
            <div align={"center"}><input className="btn btn-primary" type="submit" value="Enviar" /></div>
        </form>
    </div></Content>
    <Content className="p-5">
        <HighchartsReact highcharts={Highcharts} options={options}/>
    </Content></Layout>
}

export default Simulador;