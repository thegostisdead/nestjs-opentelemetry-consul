import Consul from 'consul';


export class Discovery {
  private consul;

  constructor(options: any) {
    this.consul = new Consul({
      host: options.host,
      port: options.port,
      secure: options.secure,
    });
  }

  async register(options: any) {
    console.log('registering with consul');
    this.consul.catalog.register(options);
  }

  async shutdown() {
    console.log('shutting down consul');
    this.consul.catalog.deregister();
  }
}
