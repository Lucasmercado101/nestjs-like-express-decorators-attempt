import "reflect-metadata";
import Express from "express";
import {
  bodyToConvert,
  Get,
  methodName,
  parameterIndex,
  protoData,
  reqProperty
} from "./routeDecorators";

const app = Express();

app.use(Express.json());

const Body = (
  t: any,
  propertyKey: methodName,
  parameterIndex: parameterIndex
): any => {
  const target = t as protoData;

  const entry: bodyToConvert = [
    propertyKey,
    reqProperty.BODY_PARAM,
    parameterIndex
  ];

  if (target.bodyToConvert) {
    target.bodyToConvert.push(entry);
  } else {
    target.bodyToConvert = [entry];
  }
};

class Controller {
  constructor(protected router = Express.Router()) {
    this.assignRoutes(this);
  }

  get getRouter() {
    return this.router;
  }

  protected assignRoutes<T extends Controller>(child: T) {
    const proto = (child as any).__proto__;
    const protoData = proto as protoData;
    if (!protoData.routes) throw new Error("No routes were assigned");

    for (const [method, values] of Object.entries(protoData.routes)) {
      for (const [fnName, path, middlewares] of values) {
        if (middlewares && middlewares.length > 0) {
          (this.router as any)[method](path, ...middlewares, proto[fnName]);
        } else {
          (this.router as any)[method](path, proto[fnName]);
        }
      }
    }
  }
}

class CatsController extends Controller {
  constructor() {
    super();
  }

  @Get("/cats")
  public async getCats(@Body body: any): Promise<string> {
    console.log(body);
    console.log("in get cats");
    return "a";
  }
}

const catsController = new CatsController();

app.use(catsController.getRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
