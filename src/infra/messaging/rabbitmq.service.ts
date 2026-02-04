import amqp, {Connection, Channel} from 'amqplib';

export async function CreateRabbitChannel(): Promise<Channel> {
    const connection: Connection = await amqp.connect(process.env.RABBITMQ_URL as string);
    const channel = await connection.createChannel();
    return channel;
}