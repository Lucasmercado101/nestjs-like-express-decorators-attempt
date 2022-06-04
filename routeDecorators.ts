import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  Router
} from "express";

type methodName = string;
type path = string;
type parameterIndex = number;

// Properties on the Request object
export enum reqProperty {
  BODY_PARAM = "body"
}

export type bodyToConvert = [methodName, reqProperty, parameterIndex];

// "global" data stored in controller's prototype
// accesed and saved into by the decorators
export type protoData = {
  routes: Partial<{
    [key in keyof Router]: [methodName, path, RequestHandler[]?][];
  }>;
  bodyToConvert?: bodyToConvert[];
};

const RouterRESTMethodFactory =
  (method: keyof Router) =>
  (path: path, middlewares?: RequestHandler[]) =>
  (t: any, propertyKey: methodName, descriptor: any) => {
    const target = t as protoData;

    if (!target.routes) {
      target.routes = { [method]: [[propertyKey, path, middlewares]] };
    } else {
      target.routes[method]!.push([propertyKey, path, middlewares]);
    }

    let toConvertVars: reqProperty[] = [];

    // There are req. things to pass to the original fn
    if (target.bodyToConvert) {
      toConvertVars = target.bodyToConvert
        .filter((x) => x[0] === propertyKey)
        // sort so they're passed in the right order
        .sort((a: any, b: any) => a[2] - b[2])
        .map((x: any) => x[1]);
    }

    const originalFn = descriptor.value;

    // TODO: ?
    // console.log(Reflect.getMetadata("design:paramtypes", target, propertyKey));

    descriptor.value = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      let convertedVars: any = [];

      if (toConvertVars.length > 0) {
        for (const paramType of toConvertVars) {
          switch (paramType) {
            case reqProperty.BODY_PARAM:
              convertedVars.push(req.body);
              break;
          }
        }
      }

      try {
        const toResp = await originalFn(...convertedVars);

        res.json(toResp);
      } catch (err) {
        next(err);
      }
    };
  };

export const Get = RouterRESTMethodFactory("get");
export const Post = RouterRESTMethodFactory("post");
export const Put = RouterRESTMethodFactory("put");
export const Delete = RouterRESTMethodFactory("delete");
export const Patch = RouterRESTMethodFactory("patch");
export const Use = RouterRESTMethodFactory("use");
